# Advanced Validations Implementation Guide

This document outlines the implementation strategy for the comprehensive set of advanced validations that will bring our Tech Stack Alignment System to 100% alignment with Next.js 15, React 19, Tailwind CSS v4, and TypeScript 5.

## Implementation Strategy

Each validation will be implemented following these steps:

1. **Rule Definition**: Define the validation rule, expected behavior, and validation logic
2. **Detection Logic**: Implement the core functionality to detect the issue
3. **Healing Logic**: Create the corresponding healing transformer
4. **Tests**: Create test cases and validation logic
5. **Documentation**: Update documentation with the new validation

## Next.js 15 Advanced Validations

### Metadata API Validation

**Priority**: High

**Implementation Details**:
- Scan app directory structure for `page.tsx` files
- Check for `export const metadata` declaration
- Validate required fields: `title`, `description`, and Open Graph metadata
- Provide healing transformer to add missing metadata fields

```typescript
// Example validation code
function validateMetadataAPI(sourceFile: SourceFile, filePath: string): ValidationIssue[] {
  // Only check page.tsx files in the app directory
  if (!filePath.includes('/app/') || !filePath.endsWith('page.tsx')) {
    return [];
  }

  const issues: ValidationIssue[] = [];
  const metadataExport = sourceFile.getVariableDeclaration('metadata');
  
  if (!metadataExport || !sourceFile.getExportedDeclarations().some(d => d === metadataExport)) {
    issues.push({
      type: 'error',
      message: 'Missing metadata export in page.tsx',
      filePath,
      line: 1,
      code: 'NEXTJS15_MISSING_METADATA',
      framework: 'nextjs',
      fix: {
        type: 'complex',
        transformer: 'addMetadataExport'
      }
    });
  } else {
    // Check for required fields in the metadata object
    // ...
  }
  
  return issues;
}
```

### Async Layout APIs

**Priority**: Medium

**Implementation Details**:
- Detect usage of headers, cookies without await in layout.tsx files
- Validate proper typing with Promise
- Provide healing transformer to add async/await pattern

```typescript
// Example validation code
function validateAsyncLayoutAPIs(sourceFile: SourceFile, filePath: string): ValidationIssue[] {
  // Only check layout.tsx files
  if (!filePath.endsWith('layout.tsx')) {
    return [];
  }

  const issues: ValidationIssue[] = [];
  
  // Find functions that use cookies() or headers() but aren't async
  const functions = sourceFile.getFunctions();
  
  for (const func of functions) {
    const isAsync = func.isAsync();
    const functionBody = func.getBodyText();
    
    // Check if the function uses cookies() or headers()
    const usesCookiesOrHeaders = functionBody.includes('cookies()') || 
                               functionBody.includes('headers()');
    
    if (usesCookiesOrHeaders && !isAsync) {
      issues.push({
        type: 'error',
        message: 'Layout function using cookies() or headers() must be async',
        filePath,
        line: func.getStartLineNumber(),
        code: 'NEXTJS15_SYNC_LAYOUT_API',
        framework: 'nextjs',
        fix: {
          type: 'complex',
          transformer: 'makeLayoutFunctionAsync'
        }
      });
    }
  }
  
  return issues;
}
```

### Dynamic Route Segments

**Priority**: Medium

**Implementation Details**:
- Analyze directory structure for dynamic route segments
- Validate proper usage of [param] vs (group) conventions
- Suggest folder structure adjustments

```typescript
// Example validation code
function validateDynamicRouteSegments(appDir: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Walk the app directory to find route segments
  function walkAppDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const segmentName = entry.name;
        const fullPath = path.join(dir, segmentName);
        
        // Check for proper naming of dynamic segments
        if (
          (segmentName.startsWith('[') && !segmentName.endsWith(']')) ||
          (segmentName.endsWith(']') && !segmentName.startsWith('['))
        ) {
          issues.push({
            type: 'error',
            message: `Malformed dynamic route segment: ${segmentName}`,
            filePath: fullPath,
            line: 0,
            code: 'NEXTJS15_MALFORMED_DYNAMIC_SEGMENT',
            framework: 'nextjs',
            fix: {
              type: 'rename_directory',
              oldPath: fullPath,
              newPath: path.join(dir, segmentName.startsWith('[') 
                ? `[${segmentName.slice(1)}]` 
                : `[${segmentName.slice(0, -1)}]`
              )
            }
          });
        }
        
        // Check proper usage of route groups
        if (
          (segmentName.startsWith('(') && !segmentName.endsWith(')')) ||
          (segmentName.endsWith(')') && !segmentName.startsWith('('))
        ) {
          issues.push({
            type: 'error',
            message: `Malformed route group: ${segmentName}`,
            filePath: fullPath,
            line: 0,
            code: 'NEXTJS15_MALFORMED_ROUTE_GROUP',
            framework: 'nextjs',
            fix: {
              type: 'rename_directory',
              oldPath: fullPath,
              newPath: path.join(dir, segmentName.startsWith('(') 
                ? `(${segmentName.slice(1)})` 
                : `(${segmentName.slice(0, -1)})`
              )
            }
          });
        }
        
        // Continue walking
        walkAppDir(fullPath);
      }
    }
  }
  
  walkAppDir(appDir);
  
  return issues;
}
```

## React 19 Advanced Validations

### String Refs

**Priority**: High

**Implementation Details**:
- Detect string refs in components (ref="myRef")
- Suggest migration to useRef or createRef
- Provide healing transformer to convert to modern pattern

```typescript
// Example validation code
function validateStringRefs(sourceFile: SourceFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Find JSX elements with string refs
  const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
  
  for (const element of jsxElements) {
    const openingElement = element.getOpeningElement();
    const attributes = openingElement.getAttributes();
    
    for (const attr of attributes) {
      if (Node.isJsxAttribute(attr)) {
        const name = attr.getNameNode().getText();
        
        if (name === 'ref') {
          const initializer = attr.getInitializer();
          
          if (initializer && Node.isStringLiteral(initializer)) {
            issues.push({
              type: 'error',
              message: 'String refs are deprecated in React 19',
              filePath: sourceFile.getFilePath(),
              line: attr.getStartLineNumber(),
              code: 'REACT19_STRING_REF',
              framework: 'react',
              fix: {
                type: 'complex',
                transformer: 'convertStringRefToUseRef'
              }
            });
          }
        }
      }
    }
  }
  
  return issues;
}
```

### FindDOMNode

**Priority**: High

**Implementation Details**:
- Detect ReactDOM.findDOMNode usage
- Suggest migration to refs
- Provide healing transformer to convert code

```typescript
// Example validation code
function validateFindDOMNode(sourceFile: SourceFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Find all calls to findDOMNode
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  for (const call of callExpressions) {
    const expression = call.getExpression();
    
    if (Node.isPropertyAccessExpression(expression)) {
      const object = expression.getExpression();
      const property = expression.getName();
      
      if (
        (Node.isIdentifier(object) && object.getText() === 'ReactDOM' && property === 'findDOMNode') ||
        (Node.isIdentifier(object) && object.getText() === 'findDOMNode')
      ) {
        issues.push({
          type: 'error',
          message: 'findDOMNode is deprecated in React 19',
          filePath: sourceFile.getFilePath(),
          line: call.getStartLineNumber(),
          code: 'REACT19_FIND_DOM_NODE',
          framework: 'react',
          fix: {
            type: 'complex',
            transformer: 'convertFindDOMNodeToRef'
          }
        });
      }
    }
  }
  
  return issues;
}
```

### Use Hook Conditional Usage

**Priority**: High

**Implementation Details**:
- Detect use hook inside conditionals, loops, or nested functions
- Suggest moving to top level
- Provide healing transformer to restructure code

```typescript
// Example validation code
function validateHookConditionalUsage(sourceFile: SourceFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Find all hook calls
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  const hookCalls = callExpressions.filter(call => {
    const expression = call.getExpression();
    return Node.isIdentifier(expression) && expression.getText().startsWith('use');
  });
  
  for (const hookCall of hookCalls) {
    // Check if hook is called inside a conditional
    const ifParent = hookCall.getFirstAncestorByKind(SyntaxKind.IfStatement);
    const ternaryParent = hookCall.getFirstAncestorByKind(SyntaxKind.ConditionalExpression);
    const loopParent = 
      hookCall.getFirstAncestorByKind(SyntaxKind.ForStatement) || 
      hookCall.getFirstAncestorByKind(SyntaxKind.ForInStatement) || 
      hookCall.getFirstAncestorByKind(SyntaxKind.ForOfStatement) ||
      hookCall.getFirstAncestorByKind(SyntaxKind.WhileStatement);
    
    // Find function parent to check if this is a nested function
    const functionParent = 
      hookCall.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ||
      hookCall.getFirstAncestorByKind(SyntaxKind.FunctionExpression) ||
      hookCall.getFirstAncestorByKind(SyntaxKind.ArrowFunction);
    
    // If we have a function parent, check if it's not the component function itself
    // (i.e., is it a nested function)
    let isNestedFunction = false;
    if (functionParent) {
      const componentFunction = sourceFile.getFunctions()[0]; // Simplification
      isNestedFunction = functionParent !== componentFunction;
    }
    
    if (ifParent || ternaryParent || loopParent || isNestedFunction) {
      issues.push({
        type: 'error',
        message: 'Hooks cannot be called conditionally or in nested functions',
        filePath: sourceFile.getFilePath(),
        line: hookCall.getStartLineNumber(),
        code: 'REACT19_CONDITIONAL_HOOK',
        framework: 'react',
        fix: {
          type: 'complex',
          transformer: 'moveHookToTopLevel'
        }
      });
    }
  }
  
  return issues;
}
```

## Tailwind CSS v4 Advanced Validations

### Logical Properties

**Priority**: Low

**Implementation Details**:
- Detect directional classes (pl-*, text-left, border-l)
- Suggest logical property alternatives
- Provide healing transformer to update class names

```typescript
// Example validation code
function validateLogicalProperties(sourceFile: SourceFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Find JSX attributes with className
  const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)
    .filter(attr => attr.getNameNode().getText() === 'className');
  
  for (const attr of jsxAttributes) {
    const initializer = attr.getInitializer();
    if (!initializer) continue;
    
    let classValue = '';
    
    if (Node.isStringLiteral(initializer)) {
      classValue = initializer.getLiteralValue();
    } else if (Node.isJsxExpression(initializer)) {
      const expression = initializer.getExpression();
      if (Node.isStringLiteral(expression)) {
        classValue = expression.getLiteralText();
      }
    }
    
    // Check for directional classes
    const directionalClasses = [
      { pattern: /\bpl-\d+\b/, logical: 'ps-', direction: 'left padding' },
      { pattern: /\bpr-\d+\b/, logical: 'pe-', direction: 'right padding' },
      { pattern: /\bml-\d+\b/, logical: 'ms-', direction: 'left margin' },
      { pattern: /\bmr-\d+\b/, logical: 'me-', direction: 'right margin' },
      { pattern: /\bborder-l-\d+\b/, logical: 'border-s-', direction: 'left border' },
      { pattern: /\bborder-r-\d+\b/, logical: 'border-e-', direction: 'right border' },
      { pattern: /\btext-left\b/, logical: 'text-start', direction: 'left text alignment' },
      { pattern: /\btext-right\b/, logical: 'text-end', direction: 'right text alignment' },
    ];
    
    for (const { pattern, logical, direction } of directionalClasses) {
      if (pattern.test(classValue)) {
        issues.push({
          type: 'suggestion',
          message: `Use logical property ${logical} instead of directional ${direction}`,
          filePath: sourceFile.getFilePath(),
          line: attr.getStartLineNumber(),
          code: 'TAILWIND4_DIRECTIONAL_CLASS',
          framework: 'tailwind',
          fix: {
            type: 'complex',
            transformer: 'convertToLogicalProperties'
          }
        });
        break;
      }
    }
  }
  
  return issues;
}
```

### Custom Plugin Migration

**Priority**: Low

**Implementation Details**:
- Detect plugins configured via config file
- Suggest migration to CSS @plugin
- Provide example code for implementation

```typescript
// Example validation code
function validateCustomPluginMigration(configPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Read the tailwind.config.js file
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for custom plugins defined in the config
    if (configContent.includes('plugins:') && configContent.includes('({ addUtilities')) {
      issues.push({
        type: 'suggestion',
        message: 'Consider migrating custom plugins to CSS @plugin directive',
        filePath: configPath,
        line: 0,
        code: 'TAILWIND4_CUSTOM_PLUGIN_CONFIG',
        framework: 'tailwind',
        fix: {
          type: 'manual',
          description: 'Migrate custom plugins to CSS @plugin',
          steps: [
            'Identify custom plugins in tailwind.config.js',
            'Create equivalent CSS @plugin directives in your CSS file',
            'Remove custom plugins from tailwind.config.js'
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error reading tailwind config:', error);
  }
  
  return issues;
}
```

### Deprecated Utility Detection

**Priority**: Medium

**Implementation Details**:
- Check for deprecated utilities in tailwind.config.js
- Suggest modern alternatives
- Provide healing transformer to update config

```typescript
// Example validation code
function validateDeprecatedUtilities(configPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Read the tailwind.config.js file
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check for deprecated utilities
    const deprecatedUtilities = [
      { name: 'target', replacement: 'targetUtil' },
      { name: 'transform', replacement: 'transformUtil' },
      { name: 'filter', replacement: 'filterUtil' },
      { name: 'isolation', replacement: 'isolationUtil' },
      { name: 'content', replacement: 'contentUtil' },
    ];
    
    for (const { name, replacement } of deprecatedUtilities) {
      if (configContent.includes(`'${name}:`)) {
        issues.push({
          type: 'warning',
          message: `Deprecated utility "${name}" detected in tailwind.config.js`,
          filePath: configPath,
          line: 0,
          code: 'TAILWIND4_DEPRECATED_UTILITY',
          framework: 'tailwind',
          fix: {
            type: 'manual',
            description: `Replace ${name} with ${replacement}`,
            steps: [
              `Find '${name}:' in the configuration`,
              `Replace with '${replacement}:'`,
              'Update any dependent classes in your code'
            ]
          }
        });
      }
    }
  } catch (error) {
    console.error('Error reading tailwind config:', error);
  }
  
  return issues;
}
```

## TypeScript 5 Advanced Validations

### VerbatimModuleSyntax

**Priority**: Medium

**Implementation Details**:
- Check tsconfig.json for verbatimModuleSyntax
- Suggest replacing older flags with this option
- Provide config update transformer

```typescript
// Example validation code
function validateVerbatimModuleSyntax(configPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  try {
    const tsConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check for old flags used instead of verbatimModuleSyntax
    const hasOldFlags = 
      tsConfig.compilerOptions?.importsNotUsedAsValues ||
      tsConfig.compilerOptions?.preserveValueImports;
    
    const hasVerbatimModuleSyntax = !!tsConfig.compilerOptions?.verbatimModuleSyntax;
    
    if (hasOldFlags && !hasVerbatimModuleSyntax) {
      issues.push({
        type: 'warning',
        message: 'Use verbatimModuleSyntax instead of deprecated options',
        filePath: configPath,
        line: 0,
        code: 'TS5_USE_VERBATIM_MODULE_SYNTAX',
        framework: 'typescript',
        fix: {
          type: 'update_json',
          path: configPath,
          operations: [
            {
              path: 'compilerOptions.verbatimModuleSyntax',
              value: true,
            },
            {
              path: 'compilerOptions.importsNotUsedAsValues',
              value: undefined,
            },
            {
              path: 'compilerOptions.preserveValueImports',
              value: undefined,
            },
          ],
        }
      });
    }
  } catch (error) {
    console.error('Error reading tsconfig:', error);
  }
  
  return issues;
}
```

### Satisfies Operator

**Priority**: Medium

**Implementation Details**:
- Detect type assertions that could benefit from satisfies
- Suggest updating to satisfies operator
- Provide code examples and healing transformer

```typescript
// Example validation code
function validateSatisfiesOperator(sourceFile: SourceFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Find type assertions that could benefit from satisfies
  const asExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression);
  
  for (const asExpr of asExpressions) {
    // Check if this is a good candidate for satisfies
    const expression = asExpr.getExpression();
    
    if (Node.isObjectLiteralExpression(expression)) {
      issues.push({
        type: 'suggestion',
        message: 'Consider using the "satisfies" operator instead of type assertion',
        filePath: sourceFile.getFilePath(),
        line: asExpr.getStartLineNumber(),
        code: 'TS5_USE_SATISFIES_OPERATOR',
        framework: 'typescript',
        fix: {
          type: 'complex',
          transformer: 'convertToSatisfiesOperator'
        }
      });
    }
  }
  
  return issues;
}
```

### Type Imports

**Priority**: Medium

**Implementation Details**:
- Detect type imports without the type keyword
- Suggest using import type { Foo } syntax
- Provide healing transformer to update imports

```typescript
// Example validation code
function validateTypeImports(sourceFile: SourceFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Find import declarations
  const importDeclarations = sourceFile.getImportDeclarations();
  
  for (const importDecl of importDeclarations) {
    // Skip if already using "import type"
    if (importDecl.isTypeOnly()) continue;
    
    // Check if all imports are used only as types
    const namedImports = importDecl.getNamedImports();
    const allUsedAsTypes = namedImports.every(namedImport => {
      const name = namedImport.getName();
      const references = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
        .filter(id => id.getText() === name);
      
      // Check if all references are in type positions
      return references.every(ref => {
        // Approximate check - in a real implementation this would be more thorough
        const typeRef = 
          ref.getFirstAncestorByKind(SyntaxKind.TypeReference) ||
          ref.getFirstAncestorByKind(SyntaxKind.TypeParameter) ||
          ref.getFirstAncestorByKind(SyntaxKind.InterfaceDeclaration) ||
          ref.getFirstAncestorByKind(SyntaxKind.TypeAliasDeclaration) ||
          ref.getFirstAncestorByKind(SyntaxKind.PropertySignature);
        
        return !!typeRef;
      });
    });
    
    if (allUsedAsTypes && namedImports.length > 0) {
      issues.push({
        type: 'suggestion',
        message: 'Use "import type" for type-only imports',
        filePath: sourceFile.getFilePath(),
        line: importDecl.getStartLineNumber(),
        code: 'TS5_USE_IMPORT_TYPE',
        framework: 'typescript',
        fix: {
          type: 'complex',
          transformer: 'convertToImportType'
        }
      });
    }
  }
  
  return issues;
}
```

## Developer Experience & CI Validations

### VSCode Workspace Settings

**Priority**: Low

**Implementation Details**:
- Check for .vscode/settings.json
- Validate necessary extensions and settings are present
- Provide template for missing settings

```typescript
// Example validation code
function validateVSCodeSettings(projectRoot: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  const vscodeDir = path.join(projectRoot, '.vscode');
  const settingsPath = path.join(vscodeDir, 'settings.json');
  
  if (!fs.existsSync(settingsPath)) {
    issues.push({
      type: 'suggestion',
      message: 'Missing VSCode workspace settings',
      filePath: vscodeDir,
      line: 0,
      code: 'DEV_MISSING_VSCODE_SETTINGS',
      framework: 'dev-experience',
      fix: {
        type: 'create_file',
        path: settingsPath,
        content: JSON.stringify({
          "editor.formatOnSave": true,
          "editor.codeActionsOnSave": {
            "source.fixAll.eslint": true
          },
          "editor.defaultFormatter": "esbenp.prettier-vscode",
          "typescript.tsdk": "node_modules/typescript/lib",
          "tailwindCSS.experimental.classRegex": [
            ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
          ],
          "typescript.preferences.importModuleSpecifier": "non-relative"
        }, null, 2)
      }
    });
  } else {
    // Check for important settings
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      if (!settings["editor.formatOnSave"]) {
        issues.push({
          type: 'suggestion',
          message: 'Enable formatOnSave in VSCode settings',
          filePath: settingsPath,
          line: 0,
          code: 'DEV_ENABLE_FORMAT_ON_SAVE',
          framework: 'dev-experience',
          fix: {
            type: 'update_json',
            path: settingsPath,
            operations: [
              {
                path: 'editor.formatOnSave',
                value: true,
              },
            ],
          }
        });
      }
    } catch (error) {
      console.error('Error reading VSCode settings:', error);
    }
  }
  
  return issues;
}
```

### CLI Schema Validation

**Priority**: Medium

**Implementation Details**:
- Implement input validation for CLI commands
- Use zod/yup/json-schema for validation
- Provide helpful error messages for invalid inputs

```typescript
// Example validation code
function validateCLISchema(cliPath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  try {
    const cliContent = fs.readFileSync(cliPath, 'utf8');
    
    // Check if using any validation library
    const hasZod = cliContent.includes('from "zod"') || cliContent.includes('from \'zod\'');
    const hasYup = cliContent.includes('from "yup"') || cliContent.includes('from \'yup\'');
    const hasJSONSchema = cliContent.includes('ajv') || cliContent.includes('jsonschema');
    
    if (!hasZod && !hasYup && !hasJSONSchema) {
      issues.push({
        type: 'suggestion',
        message: 'CLI commands should validate input with schema validation',
        filePath: cliPath,
        line: 0,
        code: 'DEV_CLI_NO_VALIDATION',
        framework: 'dev-experience',
        fix: {
          type: 'manual',
          description: 'Add schema validation to CLI commands',
          steps: [
            'Install a validation library (zod, yup, or ajv)',
            'Create schemas for CLI input validation',
            'Add validation logic before processing commands'
          ]
        }
      });
    }
  } catch (error) {
    console.error('Error reading CLI file:', error);
  }
  
  return issues;
}
```

## Implementation Timeline

### Phase 1 (Weeks 1-2)
- Implement high-priority Next.js and React validations
- Create test cases and documentation
- Release v1.1 with these features

### Phase 2 (Weeks 3-4)
- Implement high-priority TypeScript and Tailwind validations
- Expand test coverage
- Release v1.2 with these features

### Phase 3 (Weeks 5-6)
- Implement medium-priority validations across all frameworks
- Enhance healing transformers
- Release v1.3 with these features

### Phase 4 (Weeks 7-8)
- Implement remaining low-priority validations
- Complete documentation
- Release v2.0 with full feature set

## Validation Configuration Schema

Here's an updated JSON schema for configuring these validations:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Tech Stack Alignment Advanced Validations",
  "type": "object",
  "properties": {
    "nextjs": {
      "type": "object",
      "properties": {
        "metadata": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "error" },
            "requiredFields": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["title", "description", "openGraph"]
            }
          }
        },
        "asyncLayoutApis": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "warning" }
          }
        },
        "dynamicRouteSegments": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "warning" }
          }
        }
      }
    },
    "react": {
      "type": "object",
      "properties": {
        "stringRefs": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "error" }
          }
        },
        "findDOMNode": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "error" }
          }
        },
        "useHookConditionalUsage": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "error" }
          }
        }
      }
    },
    "tailwind": {
      "type": "object",
      "properties": {
        "logicalProperties": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "suggestion" }
          }
        },
        "customPluginMigration": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "suggestion" }
          }
        },
        "deprecatedUtility": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "warning" },
            "utilities": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["target", "transform", "filter", "isolation", "content"]
            }
          }
        }
      }
    },
    "typescript": {
      "type": "object",
      "properties": {
        "verbatimModuleSyntax": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "warning" }
          }
        },
        "satisfiesOperator": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "warning" }
          }
        },
        "typeImports": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "warning" }
          }
        }
      }
    },
    "devExperience": {
      "type": "object",
      "properties": {
        "vscodeWorkspaceSettings": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "suggestion" },
            "requiredSettings": {
              "type": "array",
              "items": { "type": "string" },
              "default": ["editor.formatOnSave", "editor.codeActionsOnSave"]
            }
          }
        },
        "cliSchemaValidation": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": true },
            "severity": { "type": "string", "enum": ["error", "warning", "suggestion"], "default": "warning" }
          }
        }
      }
    }
  }
}
```

## Conclusion

This comprehensive implementation of advanced validations will ensure our Tech Stack Alignment System provides full coverage for modern web development best practices. By following this plan, we'll create a tool that not only detects issues but intelligently heals them, significantly improving developer productivity and code quality.