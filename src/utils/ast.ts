import { Project, SourceFile, Node, SyntaxKind, ts } from 'ts-morph';
import * as path from 'path';
import { readFile, fileExists, getFilesWithExtension } from './fs';

/**
 * Creates a new ts-morph Project instance
 */
export function createProject() {
  return new Project({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true,
  });
}

/**
 * Adds a source file to the project
 */
export function addSourceFile(project: Project, filePath: string): SourceFile | undefined {
  try {
    return project.addSourceFileAtPath(filePath);
  } catch (error) {
    console.error(`Error adding source file ${filePath}:`, error);
    return undefined;
  }
}

/**
 * Gets all React component declarations from a source file
 */
export function getComponentDeclarations(sourceFile: SourceFile) {
  const components = [];
  
  // Find function components
  const functionComponents = sourceFile.getFunctions().filter(func => {
    const returnStatement = func.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
    return returnStatement?.getFirstDescendantByKind(SyntaxKind.JsxElement) || 
           returnStatement?.getFirstDescendantByKind(SyntaxKind.JsxSelfClosingElement);
  });
  
  // Find arrow function components
  const variableDeclarations = sourceFile.getVariableDeclarations();
  const arrowFunctionComponents = variableDeclarations.filter(varDecl => {
    const initializer = varDecl.getInitializer();
    if (Node.isArrowFunction(initializer)) {
      const returnStatement = initializer.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
      return returnStatement?.getFirstDescendantByKind(SyntaxKind.JsxElement) || 
             returnStatement?.getFirstDescendantByKind(SyntaxKind.JsxSelfClosingElement) ||
             initializer.getFirstDescendantByKind(SyntaxKind.JsxElement) ||
             initializer.getFirstDescendantByKind(SyntaxKind.JsxSelfClosingElement);
    }
    return false;
  });
  
  return [...functionComponents, ...arrowFunctionComponents];
}

/**
 * Gets all imports from a source file
 */
export function getImports(sourceFile: SourceFile) {
  return sourceFile.getImportDeclarations();
}

/**
 * Gets all hook declarations from a source file
 */
export function getHookDeclarations(sourceFile: SourceFile) {
  return sourceFile.getFunctions().filter(func => {
    const name = func.getName();
    return name && name.startsWith('use');
  });
}

/**
 * Transforms a source file using ts-morph
 */
export function transformSourceFile(sourceFile: SourceFile, transformFn: (sf: SourceFile) => void) {
  transformFn(sourceFile);
  return sourceFile.getFullText();
}

/**
 * Saves changes to a source file
 */
export function saveSourceFile(sourceFile: SourceFile) {
  return sourceFile.save();
}

/**
 * Parses a component file to extract component information
 * 
 * @param filePath Path to the component file
 * @param content Component file content (optional, will be read from file if not provided)
 * @returns ComponentContext with information about the component
 */
export async function parseComponent(filePath: string, content?: string): Promise<import('../types').ComponentContext> {
  // Create a project for this component
  const project = createProject();
  
  // Add the source file
  const sourceFile = content 
    ? project.createSourceFile(`${filePath}.temp.tsx`, content)
    : addSourceFile(project, filePath);
    
  if (!sourceFile) {
    throw new Error(`Could not parse component file: ${filePath}`);
  }
  
  // Determine if it's a TypeScript file
  const usesTypeScript = filePath.endsWith('.tsx') || filePath.endsWith('.ts');
  
  // Get component declarations
  const componentDeclarations = getComponentDeclarations(sourceFile);
  if (componentDeclarations.length === 0) {
    return {
      filePath,
      content: content || sourceFile.getFullText(),
      isComponent: false,
      usesTypeScript,
    };
  }
  
  // Get the first component declaration
  const componentDecl = componentDeclarations[0];
  const componentName = componentDecl.getName() || path.basename(filePath).split('.')[0];
  
  // Determine component type
  const isArrowFunction = Node.isVariableDeclaration(componentDecl);
  const isFunctionDeclaration = !isArrowFunction;
  
  // Check for React.FC usage
  const usesReactFC = sourceFile.getFullText().includes('React.FC') || sourceFile.getFullText().includes('React.FunctionComponent');
  
  // Look for props interface
  const hasPropInterface = sourceFile.getInterfaces().some(intf => 
    intf.getName()?.includes('Props') || 
    sourceFile.getFullText().includes(`${componentName}Props`)
  );
  
  // Determine if it's a server component (lacks "use client")
  const isServerComponent = !sourceFile.getFullText().includes('"use client"') && 
                         !sourceFile.getFullText().includes("'use client'");
  
  // Determine if it's a page component
  const isPage = filePath.includes('/pages/') || (filePath.includes('/app/') && !isServerComponent);
  
  // Find prop names
  const props: { name: string; type: string }[] = [];
  
  // Check for destructured props
  const fullText = sourceFile.getFullText();
  const propsMatch = fullText.match(/\(\{\s*([^{}]+)\s*\}\)/);
  if (propsMatch) {
    const propString = propsMatch[1];
    const propNames = propString.split(',').map(prop => prop.trim());
    propNames.forEach(propName => {
      // Look for type annotations
      const propTypeMatch = fullText.match(new RegExp(`${propName}\\s*:\\s*([^,}]+)`));
      const propType = propTypeMatch ? propTypeMatch[1].trim() : guessTypeFromName(propName);
      props.push({ name: propName, type: propType });
    });
  }
  
  // Check for event handlers (onClick, onChange, etc.)
  const events: string[] = [];
  const eventMatches = fullText.match(/on[A-Z][a-zA-Z]+/g);
  if (eventMatches) {
    events.push(...new Set(eventMatches));
  }
  
  // Check for children prop usage
  const hasChildren = fullText.includes('children') || fullText.includes('>') && fullText.includes('</');
  
  return {
    filePath,
    content: content || sourceFile.getFullText(),
    isComponent: true,
    componentName,
    usesTypeScript,
    isArrowFunction,
    isFunctionDeclaration,
    usesReactFC,
    hasPropInterface,
    hasChildren,
    isPage,
    isServerComponent,
    props,
    events,
  };
}

/**
 * Helper to guess type from prop name
 */
export function guessTypeFromName(name: string): string {
  if (name.startsWith('on') && name.length > 2 && name[2].toUpperCase() === name[2]) {
    return 'function';
  }

  if (name.includes('id') || name.includes('name') || name.includes('title') ||
      name.includes('description') || name.includes('label') || name.includes('text')) {
    return 'string';
  }

  if (name.includes('count') || name.includes('index') || name.includes('size') ||
      name.includes('length') || name.includes('width') || name.includes('height')) {
    return 'number';
  }

  if (name.includes('is') || name.includes('has') || name.includes('show') ||
      name.includes('enable') || name.includes('disable') || name.includes('active')) {
    return 'boolean';
  }

  if (name.includes('items') || name.includes('list') || name.includes('options') ||
      name.includes('data') && !name.includes('datum')) {
    return 'array';
  }

  if (name.includes('style') || name.includes('config') || name.includes('options') ||
      name.includes('settings')) {
    return 'object';
  }

  return 'string';
}

/**
 * Parse a file with TypeScript analysis
 * 
 * @param filePath Path to the file to parse
 * @returns Parsed file information with TypeScript analysis
 */
export async function parseTypeScript(filePath: string): Promise<{
  filePath: string;
  content: string;
  isReactComponent: boolean;
  isFunctionalComponent: boolean;
  componentDeclarationLine: number;
  propInterfaceName?: string;
  propInterfaceLine?: number;
  hasUntypedProps: boolean;
  untypedPropsLine?: number;
  usesAnyType: boolean;
  anyTypeLine?: number;
  isHook: boolean;
  hasHookReturnType?: boolean;
  hookDeclarationLine?: number;
  hasHookGenericParams: boolean;
  hasWeakGenericConstraints?: boolean;
  hookGenericParamsLine?: number;
  isContextProvider: boolean;
  hasContextType?: boolean;
  hasContextDefaultValue?: boolean;
  contextDeclarationLine?: number;
  shouldUseUtilityTypes: boolean;
  utilityTypeCandidateLine?: number;
  hasComplexInlineTypes: boolean;
  complexInlineTypeLine?: number;
  hasTypeOnlyImportsWithoutTypeKeyword: boolean;
  typeOnlyImportLine?: number;
  hasExportedFunctionsWithoutJSDoc: boolean;
  exportedFunctionLine?: number;
  hasInterfacePropsWithoutJSDoc: boolean;
  interfaceWithoutJSDocLine?: number;
  usesReactFC: boolean;
  hasPropInterface: boolean;
  // TypeScript 5 specific properties
  couldUseConstTypeParams?: boolean;
  constTypeParamCandidateLine?: number;
  usesSatisfiesOperator?: boolean;
  satisfiesOperatorLine?: number;
  hasInterfaceWithOptionalProps?: boolean;
  interfaceWithOptionalPropsLine?: number;
}> {
  const content = await readFile(filePath);
  const project = createProject();
  const sourceFile = project.createSourceFile(`${filePath}.temp.tsx`, content);
  
  // Basic file information
  const isReactComponent = sourceFile.getFullText().includes('React') && 
    (sourceFile.getFullText().includes('function') || sourceFile.getFullText().includes('=>')) &&
    (sourceFile.getFullText().includes('jsx') || sourceFile.getFullText().includes('<div'));
  
  const isFunctionalComponent = isReactComponent && (
    sourceFile.getFunctions().some(f => 
      f.getReturnType().getText().includes('JSX') || 
      f.getReturnType().getText().includes('React')
    ) ||
    sourceFile.getVariableDeclarations().some(v => {
      const initializer = v.getInitializer();
      return initializer && Node.isArrowFunction(initializer);
    })
  );
  
  // Find component declaration line
  let componentDeclarationLine = 1;
  if (isFunctionalComponent) {
    const functionComponents = sourceFile.getFunctions().filter(f => 
      f.getReturnType().getText().includes('JSX') || 
      f.getReturnType().getText().includes('React')
    );
    
    if (functionComponents.length > 0) {
      componentDeclarationLine = functionComponents[0].getStartLineNumber();
    } else {
      const arrowComponents = sourceFile.getVariableDeclarations().filter(v => {
        const initializer = v.getInitializer();
        return initializer && Node.isArrowFunction(initializer);
      });
      
      if (arrowComponents.length > 0) {
        componentDeclarationLine = arrowComponents[0].getStartLineNumber();
      }
    }
  }
  
  // Check for prop interfaces
  const interfaces = sourceFile.getInterfaces();
  let propInterfaceName: string | undefined;
  let propInterfaceLine: number | undefined;
  let hasUntypedProps = false;
  let untypedPropsLine: number | undefined;
  
  if (interfaces.length > 0) {
    // Find interface that looks like props
    const propInterface = interfaces.find(i => i.getName().includes('Props'));
    if (propInterface) {
      propInterfaceName = propInterface.getName();
      propInterfaceLine = propInterface.getStartLineNumber();
      
      // Check for untyped props
      const props = propInterface.getProperties();
      const untypedProp = props.find(p => !p.getType() || p.getType().getText() === 'any');
      if (untypedProp) {
        hasUntypedProps = true;
        untypedPropsLine = untypedProp.getStartLineNumber();
      }
    }
  }
  
  // Check for 'any' type usage
  const anyNodes = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);
  const usesAnyType = anyNodes.length > 0;
  const anyTypeLine = anyNodes.length > 0 ? anyNodes[0].getStartLineNumber() : undefined;
  
  // Check for hooks
  const functions = sourceFile.getFunctions();
  const isHook = functions.some(f => f.getName()?.startsWith('use'));
  let hasHookReturnType: boolean | undefined;
  let hookDeclarationLine: number | undefined;
  let hasHookGenericParams = false;
  let hasWeakGenericConstraints: boolean | undefined;
  let hookGenericParamsLine: number | undefined;
  
  if (isHook) {
    const hook = functions.find(f => f.getName()?.startsWith('use'));
    if (hook) {
      hookDeclarationLine = hook.getStartLineNumber();
      hasHookReturnType = Boolean(hook.getReturnType() && hook.getReturnType().getText() !== 'any');
      
      // Check for generic parameters
      const typeParams = hook.getTypeParameters();
      hasHookGenericParams = typeParams.length > 0;
      if (hasHookGenericParams) {
        hookGenericParamsLine = hook.getStartLineNumber();
        hasWeakGenericConstraints = typeParams.some(tp => !tp.getConstraint());
      }
    }
  }
  
  // Check for context provider
  const createContextCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(call => {
      const text = call.getExpression().getText();
      return text === 'createContext' || text === 'React.createContext';
    });
  
  const isContextProvider = createContextCalls.length > 0;
  let hasContextType: boolean | undefined;
  let hasContextDefaultValue: boolean | undefined;
  let contextDeclarationLine: number | undefined;
  
  if (isContextProvider) {
    const createContextCall = createContextCalls[0];
    contextDeclarationLine = createContextCall.getStartLineNumber();
    
    // Check if context has type parameter
    const typeArgs = createContextCall.getTypeArguments();
    hasContextType = typeArgs.length > 0;
    
    // Check for default value
    const args = createContextCall.getArguments();
    hasContextDefaultValue = args.length > 0 && args[0].getText() !== 'null' && args[0].getText() !== 'undefined';
  }
  
  // Check for opportunities to use utility types
  const typeAliases = sourceFile.getTypeAliases();
  let shouldUseUtilityTypes = false;
  let utilityTypeCandidateLine: number | undefined;
  
  for (const typeAlias of typeAliases) {
    const text = typeAlias.getType().getText();
    
    // Patterns that suggest utility type usage
    if (
      (text.includes('Pick<') && text.includes(', {') && !text.includes('Pick<')) ||
      (text.includes('{') && text.includes('?:') && text.includes('}') && !text.includes('Partial<')) ||
      (text.includes('Omit<') && text.includes(', {') && !text.includes('Omit<'))
    ) {
      shouldUseUtilityTypes = true;
      utilityTypeCandidateLine = typeAlias.getStartLineNumber();
      break;
    }
  }
  
  // Check for complex inline types
  const typeReferences = sourceFile.getDescendantsOfKind(SyntaxKind.TypeReference);
  let hasComplexInlineTypes = false;
  let complexInlineTypeLine: number | undefined;
  
  for (const typeRef of typeReferences) {
    const parent = typeRef.getParent();
    if (parent && 
        !Node.isTypeAliasDeclaration(parent) && 
        !Node.isInterfaceDeclaration(parent) && 
        typeRef.getText().length > 50) {
      hasComplexInlineTypes = true;
      complexInlineTypeLine = typeRef.getStartLineNumber();
      break;
    }
  }
  
  // Check for import types without 'import type'
  const imports = sourceFile.getImportDeclarations();
  let hasTypeOnlyImportsWithoutTypeKeyword = false;
  let typeOnlyImportLine: number | undefined;
  
  for (const imp of imports) {
    // Check if this import is only used for types
    const importedSymbols = imp.getNamedImports().map(ni => ni.getName());
    
    // If these symbols are only used in type positions, they should use 'import type'
    const isTypeOnly = importedSymbols.every(symbol => {
      const occurrences = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .filter(id => id.getText() === symbol);
      
      // If all occurrences are in type positions, this is a type-only import
      return occurrences.every(occurrence => {
        const parent = occurrence.getParent();
        return (
          parent && (
            Node.isTypeReference(parent) || 
            Node.isTypeAliasDeclaration(parent) || 
            Node.isInterfaceDeclaration(parent) ||
            Node.isTypeParameterDeclaration(parent)
          )
        );
      });
    });
    
    if (isTypeOnly && !imp.isTypeOnly() && importedSymbols.length > 0) {
      hasTypeOnlyImportsWithoutTypeKeyword = true;
      typeOnlyImportLine = imp.getStartLineNumber();
      break;
    }
  }
  
  // Check for exported functions without JSDoc
  const exportedFunctions = functions.filter(f => f.isExported());
  let hasExportedFunctionsWithoutJSDoc = false;
  let exportedFunctionLine: number | undefined;
  
  for (const func of exportedFunctions) {
    const jsDocs = func.getJsDocs();
    if (jsDocs.length === 0) {
      hasExportedFunctionsWithoutJSDoc = true;
      exportedFunctionLine = func.getStartLineNumber();
      break;
    }
  }
  
  // Check for interfaces without property JSDoc
  let hasInterfacePropsWithoutJSDoc = false;
  let interfaceWithoutJSDocLine: number | undefined;
  
  for (const intf of interfaces) {
    const properties = intf.getProperties();
    for (const prop of properties) {
      const jsDocs = prop.getJsDocs();
      if (jsDocs.length === 0) {
        hasInterfacePropsWithoutJSDoc = true;
        interfaceWithoutJSDocLine = prop.getStartLineNumber();
        break;
      }
    }
    if (hasInterfacePropsWithoutJSDoc) {
      break;
    }
  }
  
  // Check for React.FC usage
  const usesReactFC = sourceFile.getFullText().includes('React.FC') || 
                     sourceFile.getFullText().includes('React.FunctionComponent');
  
  // Check for prop interface
  const hasPropInterface = interfaces.some(i => i.getName().includes('Props'));
  
  // TypeScript 5 specific checks
  
  // Check for satisfies operator
  const usesSatisfiesOperator = content.includes('satisfies');
  const satisfiesOperatorLine = usesSatisfiesOperator 
    ? content.split('\n').findIndex(line => line.includes('satisfies')) + 1
    : undefined;
  
  // Check for interfaces with optional properties
  let hasInterfaceWithOptionalProps = false;
  let interfaceWithOptionalPropsLine: number | undefined;
  
  for (const intf of interfaces) {
    const optionalProp = intf.getProperties().find(prop => prop.hasQuestionToken());
    if (optionalProp) {
      hasInterfaceWithOptionalProps = true;
      interfaceWithOptionalPropsLine = optionalProp.getStartLineNumber();
      break;
    }
  }
  
  // Check for potential const type parameter usage
  let couldUseConstTypeParams = false;
  let constTypeParamCandidateLine: number | undefined;
  
  // Look for functions with type parameters that might benefit from const
  const genericFunctions = sourceFile.getFunctions().filter(func => func.getTypeParameters().length > 0);
  
  for (const func of genericFunctions) {
    // Check if the function uses the type parameter with literal types (arrays or objects)
    const funcText = func.getFullText();
    if (
      (funcText.includes('[]') || funcText.includes('{}')) &&
      !funcText.includes('<const')
    ) {
      couldUseConstTypeParams = true;
      constTypeParamCandidateLine = func.getStartLineNumber();
      break;
    }
  }
  
  return {
    filePath,
    content,
    isReactComponent,
    isFunctionalComponent,
    componentDeclarationLine,
    propInterfaceName,
    propInterfaceLine,
    hasUntypedProps,
    untypedPropsLine,
    usesAnyType,
    anyTypeLine,
    isHook,
    hasHookReturnType,
    hookDeclarationLine,
    hasHookGenericParams,
    hasWeakGenericConstraints,
    hookGenericParamsLine,
    isContextProvider,
    hasContextType,
    hasContextDefaultValue,
    contextDeclarationLine,
    shouldUseUtilityTypes,
    utilityTypeCandidateLine,
    hasComplexInlineTypes,
    complexInlineTypeLine,
    hasTypeOnlyImportsWithoutTypeKeyword,
    typeOnlyImportLine,
    hasExportedFunctionsWithoutJSDoc,
    exportedFunctionLine,
    hasInterfacePropsWithoutJSDoc,
    interfaceWithoutJSDocLine,
    usesReactFC,
    hasPropInterface,
    // TypeScript 5 specific properties
    couldUseConstTypeParams,
    constTypeParamCandidateLine,
    usesSatisfiesOperator,
    satisfiesOperatorLine,
    hasInterfaceWithOptionalProps,
    interfaceWithOptionalPropsLine
  };
}

/**
 * Parse a JavaScript/TypeScript file for general information
 * 
 * @param filePath Path to the file to parse
 * @returns Parsed file information
 */
export async function parseFile(filePath: string): Promise<{
  filePath: string;
  content: string;
  imports: { source: string; names: string[] }[];
  exports: string[];
  functionCalls: { name: string; args: string[] }[];
}> {
  const content = await readFile(filePath);
  const project = createProject();
  const sourceFile = project.createSourceFile(`${filePath}.temp`, content);
  
  // Extract imports
  const imports = sourceFile.getImportDeclarations().map(importDecl => {
    const source = importDecl.getModuleSpecifierValue();
    const names: string[] = [];
    
    // Add default import if exists
    const defaultImport = importDecl.getDefaultImport();
    if (defaultImport) {
      names.push(defaultImport.getText());
    }
    
    // Add named imports
    const namedImports = importDecl.getNamedImports();
    names.push(...namedImports.map(ni => ni.getName()));
    
    // Add namespace import if exists
    const namespaceImport = importDecl.getNamespaceImport();
    if (namespaceImport) {
      names.push(namespaceImport.getText());
    }
    
    return { source, names };
  });
  
  // Extract exports
  const exports: string[] = [];
  
  // Get named exports from export declarations
  const exportDeclarations = sourceFile.getExportDeclarations();
  for (const exportDecl of exportDeclarations) {
    const namedExports = exportDecl.getNamedExports();
    exports.push(...namedExports.map(ne => ne.getName()));
  }
  
  // Get exported variables and functions
  exports.push(
    ...sourceFile.getVariableDeclarations()
      .filter(vd => vd.isExported())
      .map(vd => vd.getName())
  );
  
  exports.push(
    ...sourceFile.getFunctions()
      .filter(f => f.isExported())
      .map(f => f.getName() || '')
      .filter(name => name !== '')
  );
  
  // Extract function calls
  const functionCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
    .map(call => {
      const name = call.getExpression().getText();
      const args = call.getArguments().map(arg => arg.getText());
      return { name, args };
    });
  
  return {
    filePath,
    content,
    imports,
    exports,
    functionCalls,
  };
}

/**
 * Analyze Next.js routes in a project
 * 
 * @param projectDir Path to the project directory
 * @returns Information about the Next.js routes
 */
export async function analyzeRoutes(projectDir: string): Promise<{
  hasAppRouter: boolean;
  hasPagesRouter: boolean;
  appRoutes: { path: string; isPage: boolean; isLayout: boolean; isRoute: boolean; isServerComponent: boolean }[];
  pageRoutes: { path: string; isDynamic: boolean; hasApi: boolean }[];
}> {
  const appDir = path.join(projectDir, 'src', 'app');
  const pagesDir = path.join(projectDir, 'src', 'pages');
  const appDirAlt = path.join(projectDir, 'app');
  const pagesDirAlt = path.join(projectDir, 'pages');
  
  const hasAppRouter = await Promise.all([
    await fileExists(appDir),
    await fileExists(appDirAlt)
  ]).then(results => results.some(Boolean));
  
  const hasPagesRouter = await Promise.all([
    await fileExists(pagesDir),
    await fileExists(pagesDirAlt)
  ]).then(results => results.some(Boolean));
  
  const appRoutes: { path: string; isPage: boolean; isLayout: boolean; isRoute: boolean; isServerComponent: boolean }[] = [];
  const pageRoutes: { path: string; isDynamic: boolean; hasApi: boolean }[] = [];
  
  // Analyze App Router routes if present
  if (hasAppRouter) {
    const appDirToUse = await fileExists(appDir) ? appDir : appDirAlt;
    const project = createProject();
    
    // Get all TypeScript/JavaScript files in the app directory recursively
    const appFiles = await getFilesWithExtension(appDirToUse, ['.ts', '.tsx', '.js', '.jsx'], true);
    
    for (const file of appFiles) {
      const relativePath = path.relative(appDirToUse, file);
      const sourceFile = addSourceFile(project, file);
      
      if (sourceFile) {
        const fileName = path.basename(file);
        const isPage = fileName === 'page.tsx' || fileName === 'page.js' || fileName === 'page.jsx' || fileName === 'page.ts';
        const isLayout = fileName === 'layout.tsx' || fileName === 'layout.js' || fileName === 'layout.jsx' || fileName === 'layout.ts';
        const isRoute = fileName === 'route.tsx' || fileName === 'route.js' || fileName === 'route.jsx' || fileName === 'route.ts';
        
        // Check if it's a server component (lacks "use client")
        const isServerComponent = !sourceFile.getFullText().includes('"use client"') &&
                              !sourceFile.getFullText().includes("'use client'");
        
        appRoutes.push({
          path: relativePath,
          isPage,
          isLayout,
          isRoute,
          isServerComponent
        });
      }
    }
  }
  
  // Analyze Pages Router routes if present
  if (hasPagesRouter) {
    const pagesDirToUse = await fileExists(pagesDir) ? pagesDir : pagesDirAlt;
    
    // Get all TypeScript/JavaScript files in the pages directory recursively
    const pageFiles = await getFilesWithExtension(pagesDirToUse, ['.ts', '.tsx', '.js', '.jsx'], true);
    
    for (const file of pageFiles) {
      const relativePath = path.relative(pagesDirToUse, file);
      const fileName = path.basename(file);
      
      // Check if it's a dynamic route
      const isDynamic = fileName.includes('[') && fileName.includes(']');
      
      // Check if it's an API route
      const hasApi = relativePath.startsWith('api/') || relativePath.includes('/api/');
      
      pageRoutes.push({
        path: relativePath,
        isDynamic,
        hasApi
      });
    }
  }
  
  // Create a result object with both API method and array functionality
  const result = {
    hasAppRouter,
    hasPagesRouter,
    appRoutes,
    pageRoutes,
    // Add filter method for compatibility with array operations
    filter: function(callback: (route: any) => boolean) {
      // Combine routes and add depth information
      const allRoutes = [
        ...appRoutes.map(route => ({ ...route, depth: route.path.split('/').length })),
        ...pageRoutes.map(route => ({ ...route, depth: route.path.split('/').length }))
      ];
      return allRoutes.filter(callback);
    }
  };
  
  return result;
}
