"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReact19Implementation = validateReact19Implementation;
const path = __importStar(require("path"));
const ts_morph_1 = require("ts-morph");
const project_scanner_1 = require("../utils/project-scanner");
/**
 * Validates React 19 implementation in a project
 */
async function validateReact19Implementation(context) {
    const issues = [];
    // Scan project to get component and hook files
    const scanResult = await (0, project_scanner_1.scanProject)(context);
    const componentFiles = scanResult.componentFiles;
    const hookFiles = scanResult.hookFiles;
    console.log(`Found ${componentFiles.length} component files and ${hookFiles.length} hook files to validate`);
    // Validate components
    for (const filePath of componentFiles) {
        // Skip test files
        if (filePath.includes('.test.') || filePath.includes('.spec.')) {
            continue;
        }
        // Get the source file using ts-morph
        const sourceFile = context.project.getSourceFile(filePath);
        if (!sourceFile)
            continue;
        console.log(`Analyzing React implementation in: ${path.basename(filePath)}`);
        // Extract component context from source file
        const componentContext = extractComponentContext(sourceFile, filePath);
        // Skip non-component files (utilities, etc.)
        if (!componentContext.isComponent) {
            continue;
        }
        // Validate "use client" directive
        const useDirectiveIssues = validateUseDirective(componentContext, filePath);
        issues.push(...useDirectiveIssues);
        // Validate hooks implementation
        const hookIssues = validateHooks(componentContext, filePath);
        issues.push(...hookIssues);
        // Validate server component patterns
        const serverComponentIssues = validateServerComponents(componentContext, filePath);
        issues.push(...serverComponentIssues);
        // Validate component exports
        const exportIssues = validateComponentExports(componentContext, filePath);
        issues.push(...exportIssues);
        // Validate transition API usage
        const transitionIssues = validateTransitions(componentContext, filePath);
        issues.push(...transitionIssues);
        // Validate React.FC usage
        const fcIssues = validateReactFC(componentContext, filePath);
        issues.push(...fcIssues);
        // Validate prop destructuring
        const propIssues = validatePropDestructuring(componentContext, filePath);
        issues.push(...propIssues);
        // Validate string refs
        const stringRefIssues = validateStringRefs(sourceFile, filePath);
        issues.push(...stringRefIssues);
        // Validate findDOMNode usage
        const findDOMNodeIssues = validateFindDOMNode(sourceFile, filePath);
        issues.push(...findDOMNodeIssues);
        // Validate use hooks conditional usage
        const conditionalHookIssues = validateHookConditionalUsage(sourceFile, filePath);
        issues.push(...conditionalHookIssues);
        // Validate head elements in JSX
        const headElementIssues = validateHeadElementsInJSX(sourceFile, filePath);
        issues.push(...headElementIssues);
        // Validate suspense boundaries
        const suspenseBoundaryIssues = validateSuspenseBoundaries(sourceFile, filePath);
        issues.push(...suspenseBoundaryIssues);
    }
    // Validate hooks
    for (const filePath of hookFiles) {
        // Get the source file using ts-morph
        const sourceFile = context.project.getSourceFile(filePath);
        if (!sourceFile)
            continue;
        console.log(`Analyzing React hook in: ${path.basename(filePath)}`);
        // Extract hook context from source file
        const hookContext = extractHookContext(sourceFile, filePath);
        // Validate hook naming
        const hookNamingIssues = validateHookNaming(hookContext, filePath);
        issues.push(...hookNamingIssues);
        // Validate hook return value
        const hookReturnIssues = validateHookReturn(hookContext, filePath);
        issues.push(...hookReturnIssues);
        // Validate hook implementation
        const hookImplementationIssues = validateHookImplementation(hookContext, filePath);
        issues.push(...hookImplementationIssues);
        // Validate useFormState
        const useFormStateIssues = validateUseFormState(sourceFile, filePath);
        issues.push(...useFormStateIssues);
    }
    return {
        valid: issues.length === 0,
        issues,
    };
}
/**
 * Extracts component context from a source file using ts-morph
 */
function extractComponentContext(sourceFile, filePath) {
    var _a, _b, _c, _d, _e;
    const context = {
        filePath,
        isComponent: false,
        componentName: '',
        isFunctionalComponent: false,
        isServerComponent: !sourceFile.getFullText().includes('"use client"'),
        hasUseClientDirective: sourceFile.getFullText().includes('"use client"'),
        usesState: false,
        usesEffect: false,
        usesRef: false,
        usesTransition: false,
        usesUseHook: false,
        hasAsyncOperations: false,
        usesPromiseThen: false,
        hasDefaultExport: false,
        hasNamedExport: false,
        hasLoadingState: false,
        usesReactFC: false,
        usesPropsWithoutDestructuring: false,
        usesLegacyContext: false,
        hasStateTypeParameters: false,
        effectHooks: [],
    };
    // Check for component declarations
    const componentDeclarations = findComponentDeclarations(sourceFile);
    if (componentDeclarations.length > 0) {
        context.isComponent = true;
        context.isFunctionalComponent = true;
        // Get first component's name
        const firstComponent = componentDeclarations[0];
        context.componentName = firstComponent.name;
        context.componentDeclarationLine = firstComponent.line;
        // Check if uses React.FC
        context.usesReactFC = firstComponent.usesReactFC;
    }
    // Check for imports
    const importDeclarations = sourceFile.getImportDeclarations();
    // Check for React imports and hooks
    for (const importDecl of importDeclarations) {
        if (importDecl.getModuleSpecifierValue() === 'react') {
            const namedImports = importDecl.getNamedImports();
            context.usesState = namedImports.some(imp => imp.getName() === 'useState');
            context.usesEffect = namedImports.some(imp => imp.getName() === 'useEffect');
            context.usesRef = namedImports.some(imp => imp.getName() === 'useRef');
            context.usesTransition = namedImports.some(imp => imp.getName() === 'useTransition');
            context.usesUseHook = namedImports.some(imp => imp.getName() === 'use');
        }
    }
    // Check for useEffect hooks
    const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
    for (const call of callExpressions) {
        const expression = call.getExpression();
        // Check for useEffect
        if (ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'useEffect') {
            const args = call.getArguments();
            if (args.length >= 2) { // Has dependency array
                const callback = args[0];
                const depsArray = args[1];
                if (ts_morph_1.Node.isArrayLiteralExpression(depsArray)) {
                    const deps = depsArray.getElements().map(el => el.getText());
                    const missingDependencies = []; // Would need more analysis to determine missing dependencies
                    context.effectHooks.push({
                        line: call.getStartLineNumber(),
                        dependencyArrayText: depsArray.getText(),
                        missingDependencies,
                    });
                }
            }
        }
        // Check for useState with type parameters
        if (ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'useState') {
            const typeArgs = call.getTypeArguments();
            context.hasStateTypeParameters = typeArgs.length > 0;
            context.stateHookLine = call.getStartLineNumber();
        }
        // Check for data fetching
        if (ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'fetch') {
            context.hasAsyncOperations = true;
            context.asyncOperationLine = call.getStartLineNumber();
        }
        // Check for axios
        if (ts_morph_1.Node.isPropertyAccessExpression(expression)) {
            const object = expression.getExpression();
            if (ts_morph_1.Node.isIdentifier(object) && object.getText() === 'axios') {
                context.hasAsyncOperations = true;
                context.asyncOperationLine = call.getStartLineNumber();
            }
        }
        // Check for promise .then
        if (ts_morph_1.Node.isPropertyAccessExpression(expression) && expression.getName() === 'then') {
            context.usesPromiseThen = true;
            context.promiseThenLine = call.getStartLineNumber();
        }
    }
    // Check for exports
    const exportAssignments = sourceFile.getExportAssignments();
    const exportDeclarations = sourceFile.getExportDeclarations();
    const variableStatements = sourceFile.getVariableStatements().filter(s => s.getFirstModifierByKind(ts_morph_1.SyntaxKind.ExportKeyword));
    const functionDeclarations = sourceFile.getFunctions().filter(f => f.getFirstModifierByKind(ts_morph_1.SyntaxKind.ExportKeyword));
    context.hasDefaultExport = exportAssignments.some(exp => exp.isExportEquals() === false);
    context.hasNamedExport = exportDeclarations.length > 0 || variableStatements.length > 0 || functionDeclarations.length > 0;
    context.exportLine = ((_a = exportAssignments[0]) === null || _a === void 0 ? void 0 : _a.getStartLineNumber()) ||
        ((_b = exportDeclarations[0]) === null || _b === void 0 ? void 0 : _b.getStartLineNumber()) ||
        ((_c = variableStatements[0]) === null || _c === void 0 ? void 0 : _c.getStartLineNumber()) ||
        ((_d = functionDeclarations[0]) === null || _d === void 0 ? void 0 : _d.getStartLineNumber()) || 0;
    // Check for loading state
    const variables = sourceFile.getVariableDeclarations();
    context.hasLoadingState = variables.some(v => {
        const name = v.getName();
        return name.includes('loading') || name.includes('isLoading');
    });
    context.loadingStateLine = ((_e = variables.find(v => {
        const name = v.getName();
        return name.includes('loading') || name.includes('isLoading');
    })) === null || _e === void 0 ? void 0 : _e.getStartLineNumber()) || 0;
    // Check for props without destructuring
    context.usesPropsWithoutDestructuring = sourceFile.getFullText().includes('props.');
    context.propsUsageLine = sourceFile.getFullText().indexOf('props.') !== -1 ?
        sourceFile.getFullText().substring(0, sourceFile.getFullText().indexOf('props.')).split('\n').length : 0;
    // Check for client hooks in what appears to be a server component
    if (context.isServerComponent && (context.usesState || context.usesEffect || context.usesRef)) {
        context.clientHookLine = sourceFile.getFullText().indexOf('useState') !== -1 ?
            sourceFile.getFullText().substring(0, sourceFile.getFullText().indexOf('useState')).split('\n').length :
            sourceFile.getFullText().indexOf('useEffect') !== -1 ?
                sourceFile.getFullText().substring(0, sourceFile.getFullText().indexOf('useEffect')).split('\n').length :
                sourceFile.getFullText().indexOf('useRef') !== -1 ?
                    sourceFile.getFullText().substring(0, sourceFile.getFullText().indexOf('useRef')).split('\n').length : 0;
    }
    // If we have a "use client" directive, find its line number
    if (context.hasUseClientDirective) {
        context.useClientDirectiveLine = sourceFile.getFullText().indexOf('"use client"') !== -1 ?
            sourceFile.getFullText().substring(0, sourceFile.getFullText().indexOf('"use client"')).split('\n').length : 0;
    }
    return context;
}
/**
 * Find component declarations in a source file
 */
function findComponentDeclarations(sourceFile) {
    const components = [];
    // Check for function components
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
        // Check if it returns JSX
        const hasJsxReturn = doesFunctionReturnJsx(func);
        if (hasJsxReturn) {
            const name = func.getName() || '';
            if (name) {
                const usesReactFC = func.getType().getText().includes('React.FC') ||
                    func.getType().getText().includes('React.FunctionComponent');
                components.push({
                    name,
                    line: func.getStartLineNumber(),
                    usesReactFC
                });
            }
        }
    }
    // Check for variable declarations that are arrow functions
    const variables = sourceFile.getVariableDeclarations();
    for (const variable of variables) {
        const initializer = variable.getInitializer();
        // Check if it's an arrow function
        if (ts_morph_1.Node.isArrowFunction(initializer)) {
            // Check if it returns JSX
            const hasJsxReturn = doesArrowFunctionReturnJsx(initializer);
            if (hasJsxReturn) {
                const name = variable.getName();
                // Check if it has React.FC type
                const type = variable.getType().getText();
                const usesReactFC = type.includes('React.FC') || type.includes('React.FunctionComponent');
                components.push({
                    name,
                    line: variable.getStartLineNumber(),
                    usesReactFC
                });
            }
        }
    }
    return components;
}
/**
 * Check if a function returns JSX
 */
function doesFunctionReturnJsx(func) {
    // Look for return statements with JSX
    const returnStatements = func.getDescendantsOfKind(ts_morph_1.SyntaxKind.ReturnStatement);
    for (const returnStmt of returnStatements) {
        const expression = returnStmt.getExpression();
        if (!expression)
            continue;
        // Check if return expression is JSX
        if (hasJsxInNode(expression)) {
            return true;
        }
    }
    return false;
}
/**
 * Check if an arrow function returns JSX
 */
function doesArrowFunctionReturnJsx(arrowFunc) {
    // For expression body arrow functions
    const body = arrowFunc.getBody();
    // If the body is an expression (not a block), check if it's JSX
    if (!ts_morph_1.Node.isBlock(body)) {
        return hasJsxInNode(body);
    }
    // For block body, check the return statements
    const returnStatements = body.getDescendantsOfKind(ts_morph_1.SyntaxKind.ReturnStatement);
    for (const returnStmt of returnStatements) {
        const expression = returnStmt.getExpression();
        if (!expression)
            continue;
        if (hasJsxInNode(expression)) {
            return true;
        }
    }
    return false;
}
/**
 * Check if a node contains JSX
 */
function hasJsxInNode(node) {
    // Check if the node itself is a JSX element or fragment
    if (ts_morph_1.Node.isJsxElement(node) || ts_morph_1.Node.isJsxFragment(node) ||
        ts_morph_1.Node.isJsxSelfClosingElement(node)) {
        return true;
    }
    // Check children if the node doesn't need to be checked itself
    return node.getDescendants().some((desc) => ts_morph_1.Node.isJsxElement(desc) ||
        ts_morph_1.Node.isJsxFragment(desc) ||
        ts_morph_1.Node.isJsxSelfClosingElement(desc));
}
/**
 * Extracts hook context from a source file
 */
function extractHookContext(sourceFile, filePath) {
    var _a;
    const context = {
        filePath,
        isHook: false,
        name: '',
        hasReturnValue: false,
        hasConditionalHookCall: false,
    };
    // Check for hook functions - they must be named starting with "use"
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
        const name = func.getName();
        if (name && name.startsWith('use')) {
            context.isHook = true;
            context.name = name;
            context.nameDeclarationLine = func.getStartLineNumber();
            context.functionBodyLine = ((_a = func.getBody()) === null || _a === void 0 ? void 0 : _a.getStartLineNumber()) || 0;
            // Check for return statements
            const returnStatements = func.getDescendantsOfKind(ts_morph_1.SyntaxKind.ReturnStatement);
            context.hasReturnValue = returnStatements.length > 0;
            // Check for conditional hook calls
            // Look for hook calls inside if statements or ternary expressions
            const ifStatements = func.getDescendantsOfKind(ts_morph_1.SyntaxKind.IfStatement);
            const conditionalExpressions = func.getDescendantsOfKind(ts_morph_1.SyntaxKind.ConditionalExpression);
            const hookCallInIfStatement = ifStatements.some(ifStmt => {
                return ifStmt.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression).some(call => {
                    const expression = call.getExpression();
                    return ts_morph_1.Node.isIdentifier(expression) && expression.getText().startsWith('use');
                });
            });
            const hookCallInTernary = conditionalExpressions.some(condExpr => {
                return condExpr.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression).some(call => {
                    const expression = call.getExpression();
                    return ts_morph_1.Node.isIdentifier(expression) && expression.getText().startsWith('use');
                });
            });
            context.hasConditionalHookCall = hookCallInIfStatement || hookCallInTernary;
            if (context.hasConditionalHookCall) {
                const firstIfWithHook = ifStatements.find(ifStmt => {
                    return ifStmt.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression).some(call => {
                        const expression = call.getExpression();
                        return ts_morph_1.Node.isIdentifier(expression) && expression.getText().startsWith('use');
                    });
                });
                const firstTernaryWithHook = conditionalExpressions.find(condExpr => {
                    return condExpr.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression).some(call => {
                        const expression = call.getExpression();
                        return ts_morph_1.Node.isIdentifier(expression) && expression.getText().startsWith('use');
                    });
                });
                context.conditionalHookLine = (firstIfWithHook === null || firstIfWithHook === void 0 ? void 0 : firstIfWithHook.getStartLineNumber()) ||
                    (firstTernaryWithHook === null || firstTernaryWithHook === void 0 ? void 0 : firstTernaryWithHook.getStartLineNumber()) || 0;
            }
            break; // Only analyze the first hook function
        }
    }
    return context;
}
/**
 * Validates "use client" directive in components
 */
function validateUseDirective(component, filePath) {
    const issues = [];
    // Check for server components with "use client" directive
    if (component.isServerComponent && component.hasUseClientDirective) {
        issues.push({
            type: 'error',
            message: 'Server component should not have "use client" directive',
            filePath,
            line: component.useClientDirectiveLine,
            code: 'REACT19_SERVER_COMPONENT_WITH_USE_CLIENT',
            framework: 'react',
            fix: {
                type: 'remove_line',
                line: component.useClientDirectiveLine,
            },
            documentation: 'https://react.dev/reference/directives',
        });
    }
    // Check for client-side features without "use client" directive
    if (!component.isServerComponent && !component.hasUseClientDirective &&
        (component.usesState || component.usesEffect || component.usesRef)) {
        issues.push({
            type: 'error',
            message: 'Client component with hooks must have "use client" directive',
            filePath,
            line: 1,
            code: 'REACT19_MISSING_USE_CLIENT',
            framework: 'react',
            fix: {
                type: 'insert_line',
                line: 1,
                content: '"use client";',
            },
            documentation: 'https://react.dev/reference/directives',
        });
    }
    return issues;
}
/**
 * Validates hooks implementation in components
 */
function validateHooks(component, filePath) {
    const issues = [];
    // Validate useState with TypeScript generics
    if (component.usesState && !component.hasStateTypeParameters) {
        issues.push({
            type: 'warning',
            message: 'useState should use explicit TypeScript generic parameters',
            filePath,
            line: component.stateHookLine,
            code: 'REACT19_UNTYPED_STATE',
            framework: 'react',
            fix: {
                type: 'replace',
                pattern: 'useState(',
                replacement: 'useState<{type}>(',
                context: 'needs-manual-type-definition'
            },
            documentation: 'https://react.dev/reference/react/useState',
        });
    }
    // Check for new React 19 'use' hook pattern for promises
    if (component.hasAsyncOperations && !component.usesUseHook) {
        issues.push({
            type: 'suggestion',
            message: 'Consider using the "use" hook for Promise handling',
            filePath,
            line: component.asyncOperationLine,
            code: 'REACT19_MISSING_USE_HOOK',
            framework: 'react',
            fix: {
                type: 'complex',
                transformer: 'transformToUseHook',
            },
            documentation: 'https://react.dev/reference/react/use',
        });
    }
    // Validate useEffect dependencies
    component.effectHooks.forEach((hook) => {
        if (hook.missingDependencies.length > 0) {
            issues.push({
                type: 'error',
                message: `useEffect is missing dependencies: ${hook.missingDependencies.join(', ')}`,
                filePath,
                line: hook.line,
                code: 'REACT19_INCOMPLETE_EFFECT_DEPS',
                framework: 'react',
                fix: {
                    type: 'replace',
                    pattern: hook.dependencyArrayText,
                    replacement: `[${hook.missingDependencies.join(', ')}, ${hook.dependencyArrayText.slice(1, -1)}]`
                },
                documentation: 'https://react.dev/reference/react/useEffect',
            });
        }
    });
    // Check for outdated context usage (useContext instead of createContext().Provider)
    if (component.usesLegacyContext) {
        issues.push({
            type: 'error',
            message: 'Using legacy context API instead of React.createContext',
            filePath,
            line: component.legacyContextLine,
            code: 'REACT19_LEGACY_CONTEXT',
            framework: 'react',
            fix: {
                type: 'complex',
                transformer: 'transformToModernContext',
            },
            documentation: 'https://react.dev/reference/react/createContext',
        });
    }
    return issues;
}
/**
 * Validates server component patterns
 */
function validateServerComponents(component, filePath) {
    const issues = [];
    // Check for proper server component patterns
    if (component.isServerComponent) {
        // Server components shouldn't use client-side hooks
        if (component.usesState || component.usesEffect || component.usesRef) {
            issues.push({
                type: 'error',
                message: 'Server component should not use client-side hooks (useState, useEffect, useRef)',
                filePath,
                line: component.clientHookLine,
                code: 'REACT19_SERVER_COMPONENT_WITH_CLIENT_HOOKS',
                framework: 'react',
                fix: {
                    type: 'manual',
                    description: 'Convert to client component or extract client-side logic',
                    steps: [
                        'Add "use client" directive at the top of the file',
                        'Or extract client-side logic to a separate client component'
                    ]
                },
                documentation: 'https://react.dev/reference/react/directives',
            });
        }
        // Server components should use async/await for data fetching
        if (component.usesPromiseThen) {
            issues.push({
                type: 'warning',
                message: 'Server component should use async/await instead of .then() for cleaner code',
                filePath,
                line: component.promiseThenLine,
                code: 'REACT19_SERVER_COMPONENT_PROMISE_THEN',
                framework: 'react',
                fix: {
                    type: 'complex',
                    transformer: 'transformPromiseToAsyncAwait',
                },
                documentation: 'https://react.dev/reference/react-dom/server-components',
            });
        }
    }
    return issues;
}
/**
 * Validates component exports
 */
function validateComponentExports(component, filePath) {
    const issues = [];
    // Check for default exports (we prefer named exports)
    if (component.hasDefaultExport && !component.hasNamedExport) {
        issues.push({
            type: 'warning',
            message: 'Prefer named exports over default exports for components',
            filePath,
            line: component.exportLine,
            code: 'REACT19_DEFAULT_EXPORT',
            framework: 'react',
            fix: {
                type: 'complex',
                transformer: 'transformToNamedExport',
            },
            documentation: 'https://basarat.gitbook.io/typescript/main-1/defaultisbad',
        });
    }
    // Check for correct naming conventions
    if (component.componentName && !isPascalCase(component.componentName)) {
        issues.push({
            type: 'error',
            message: `Component name "${component.componentName}" should be PascalCase`,
            filePath,
            line: component.componentDeclarationLine,
            code: 'REACT19_COMPONENT_NAMING',
            framework: 'react',
            fix: {
                type: 'replace',
                pattern: `${component.componentName}`,
                replacement: toPascalCase(component.componentName),
                context: 'component-declaration'
            },
            documentation: 'https://reactjs.org/docs/jsx-in-depth.html#user-defined-components-must-be-capitalized',
        });
    }
    return issues;
}
/**
 * Validates transition API usage
 */
function validateTransitions(component, filePath) {
    const issues = [];
    // Check for manual loading state management without useTransition
    if (component.hasLoadingState && !component.usesTransition) {
        issues.push({
            type: 'suggestion',
            message: 'Consider using useTransition hook for loading state management',
            filePath,
            line: component.loadingStateLine,
            code: 'REACT19_MISSING_TRANSITION',
            framework: 'react',
            fix: {
                type: 'complex',
                transformer: 'transformToUseTransition',
            },
            documentation: 'https://react.dev/reference/react/useTransition',
        });
    }
    return issues;
}
/**
 * Validates React.FC usage for functional components
 */
function validateReactFC(component, filePath) {
    const issues = [];
    // Check for functional components without React.FC
    if (component.isFunctionalComponent && !component.usesReactFC) {
        issues.push({
            type: 'warning',
            message: 'Functional component should use React.FC type',
            filePath,
            line: component.componentDeclarationLine,
            code: 'REACT19_MISSING_FC_TYPE',
            framework: 'react',
            fix: {
                type: 'complex',
                transformer: 'addReactFCType',
            },
            documentation: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components/',
        });
    }
    return issues;
}
/**
 * Validates prop destructuring
 */
function validatePropDestructuring(component, filePath) {
    const issues = [];
    // Check for props without destructuring
    if (component.usesPropsWithoutDestructuring) {
        issues.push({
            type: 'suggestion',
            message: 'Consider destructuring props for cleaner code',
            filePath,
            line: component.propsUsageLine,
            code: 'REACT19_USE_PROPS_DESTRUCTURING',
            framework: 'react',
            fix: {
                type: 'complex',
                transformer: 'transformToDestructuredProps',
            },
            documentation: 'https://reactjs.org/docs/components-and-props.html',
        });
    }
    return issues;
}
/**
 * Validates hook naming
 */
function validateHookNaming(hook, filePath) {
    const issues = [];
    // Hook names should start with 'use'
    if (hook.isHook && !hook.name.startsWith('use')) {
        issues.push({
            type: 'error',
            message: `Hook name "${hook.name}" must start with 'use'`,
            filePath,
            line: hook.nameDeclarationLine,
            code: 'REACT19_INVALID_HOOK_NAME',
            framework: 'react',
            fix: {
                type: 'replace',
                pattern: `${hook.name}`,
                replacement: `use${hook.name.charAt(0).toUpperCase()}${hook.name.slice(1)}`,
                context: 'hook-declaration'
            },
            documentation: 'https://reactjs.org/docs/hooks-rules.html',
        });
    }
    return issues;
}
/**
 * Validates hook return value
 */
function validateHookReturn(hook, filePath) {
    const issues = [];
    // Hook should have a return value
    if (hook.isHook && !hook.hasReturnValue) {
        issues.push({
            type: 'error',
            message: 'Hook must return a value',
            filePath,
            line: hook.functionBodyLine,
            code: 'REACT19_HOOK_NO_RETURN',
            framework: 'react',
            fix: {
                type: 'manual',
                description: 'Add a return value to the hook',
            },
            documentation: 'https://reactjs.org/docs/hooks-rules.html',
        });
    }
    return issues;
}
/**
 * Validates hook implementation
 */
function validateHookImplementation(hook, filePath) {
    const issues = [];
    // Hook should not call other hooks conditionally
    if (hook.hasConditionalHookCall) {
        issues.push({
            type: 'error',
            message: 'Hooks cannot be called conditionally',
            filePath,
            line: hook.conditionalHookLine,
            code: 'REACT19_CONDITIONAL_HOOK',
            framework: 'react',
            fix: {
                type: 'manual',
                description: 'Move hook call outside of conditional',
                steps: [
                    'Extract hook call to the top level of the hook function',
                    'Use the result conditionally instead of conditionally calling the hook'
                ]
            },
            documentation: 'https://reactjs.org/docs/hooks-rules.html',
        });
    }
    return issues;
}
/**
 * Validates string refs
 */
function validateStringRefs(sourceFile, filePath) {
    const issues = [];
    // Find JSX elements with string refs
    const jsxElements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxElement);
    const jsxSelfClosingElements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxSelfClosingElement);
    // Helper function to check attributes
    const checkAttributes = (attributes) => {
        for (const attr of attributes) {
            if (ts_morph_1.Node.isJsxAttribute(attr)) {
                const name = attr.getNameNode().getText();
                if (name === 'ref') {
                    const initializer = attr.getInitializer();
                    if (initializer && ts_morph_1.Node.isStringLiteral(initializer)) {
                        const refName = initializer.getLiteralValue();
                        issues.push({
                            type: 'error',
                            message: `String ref "${refName}" is deprecated - use useRef hook instead`,
                            filePath,
                            line: attr.getStartLineNumber(),
                            code: 'REACT19_STRING_REF',
                            framework: 'react',
                            fix: {
                                type: 'complex',
                                transformer: 'convertStringRefToUseRef',
                                context: {
                                    refName,
                                    startLine: attr.getStartLineNumber()
                                }
                            },
                            documentation: 'https://react.dev/reference/react/useRef',
                        });
                    }
                }
            }
        }
    };
    // Check regular elements
    for (const element of jsxElements) {
        const openingElement = element.getOpeningElement();
        const attributes = openingElement.getAttributes();
        checkAttributes(attributes);
    }
    // Check self-closing elements
    for (const element of jsxSelfClosingElements) {
        const attributes = element.getAttributes();
        checkAttributes(attributes);
    }
    return issues;
}
/**
 * Validates findDOMNode usage
 */
function validateFindDOMNode(sourceFile, filePath) {
    const issues = [];
    // Find all calls to findDOMNode
    const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
    for (const call of callExpressions) {
        const expression = call.getExpression();
        // Check for ReactDOM.findDOMNode
        if (ts_morph_1.Node.isPropertyAccessExpression(expression)) {
            const object = expression.getExpression();
            const property = expression.getName();
            if ((ts_morph_1.Node.isIdentifier(object) && object.getText() === 'ReactDOM' && property === 'findDOMNode') ||
                (ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'findDOMNode')) {
                // Get argument to see what element is being accessed
                const args = call.getArguments();
                const arg = args.length > 0 ? args[0].getText() : 'element';
                issues.push({
                    type: 'error',
                    message: `findDOMNode is deprecated - use React refs instead`,
                    filePath,
                    line: call.getStartLineNumber(),
                    code: 'REACT19_FIND_DOM_NODE',
                    framework: 'react',
                    fix: {
                        type: 'complex',
                        transformer: 'convertFindDOMNodeToRef',
                        context: {
                            element: arg,
                            startLine: call.getStartLineNumber()
                        }
                    },
                    documentation: 'https://react.dev/reference/react-dom/findDOMNode',
                });
            }
        }
    }
    return issues;
}
/**
 * Validates useFormState
 */
function validateUseFormState(sourceFile, filePath) {
    const issues = [];
    // Check for useFormState import
    const importDeclarations = sourceFile.getImportDeclarations();
    for (const importDecl of importDeclarations) {
        if (importDecl.getModuleSpecifierValue() === 'react-dom') {
            const namedImports = importDecl.getNamedImports();
            const usesFormState = namedImports.some(imp => imp.getName() === 'useFormState');
            if (usesFormState) {
                issues.push({
                    type: 'warning',
                    message: 'useFormState is deprecated - use useActionState instead',
                    filePath,
                    line: importDecl.getStartLineNumber(),
                    code: 'REACT19_USE_FORM_STATE',
                    framework: 'react',
                    fix: {
                        type: 'complex',
                        transformer: 'replaceUseFormStateWithUseActionState',
                        context: {
                            importLine: importDecl.getStartLineNumber()
                        }
                    },
                    documentation: 'https://react.dev/reference/react/useActionState',
                });
                // Also find all useFormState calls and suggest updates
                const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
                for (const call of callExpressions) {
                    const expression = call.getExpression();
                    if (ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'useFormState') {
                        issues.push({
                            type: 'warning',
                            message: 'useFormState call should be updated to useActionState',
                            filePath,
                            line: call.getStartLineNumber(),
                            code: 'REACT19_USE_FORM_STATE_CALL',
                            framework: 'react',
                            fix: {
                                type: 'replace',
                                pattern: 'useFormState',
                                replacement: 'useActionState',
                                context: 'call-expression'
                            },
                            documentation: 'https://react.dev/reference/react/useActionState',
                        });
                    }
                }
            }
        }
    }
    return issues;
}
/**
 * Validates use hook conditional usage
 */
function validateHookConditionalUsage(sourceFile, filePath) {
    const issues = [];
    // Find all hook calls
    const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
    const hookCalls = callExpressions.filter(call => {
        const expression = call.getExpression();
        return ts_morph_1.Node.isIdentifier(expression) && expression.getText().startsWith('use');
    });
    for (const hookCall of hookCalls) {
        // Check if hook is called inside a conditional
        const ifParent = hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.IfStatement);
        const ternaryParent = hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ConditionalExpression);
        const loopParent = hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ForStatement) ||
            hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ForInStatement) ||
            hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ForOfStatement) ||
            hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.WhileStatement);
        // Find component/function parent to check if this is a nested function
        const functionParent = hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.FunctionDeclaration) ||
            hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.FunctionExpression) ||
            hookCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ArrowFunction);
        // Find the component function if it exists
        const componentFunction = sourceFile.getFunctions().find(func => {
            // Look for functions that return JSX
            return doesFunctionReturnJsx(func);
        });
        // If we have a function parent, check if it's not the component function itself
        let isNestedFunction = false;
        if (functionParent && componentFunction) {
            isNestedFunction = functionParent !== componentFunction;
        }
        if (ifParent || ternaryParent || loopParent || isNestedFunction) {
            // Get the hook name for better error message
            const expression = hookCall.getExpression();
            const hookName = ts_morph_1.Node.isIdentifier(expression) ? expression.getText() : 'hook';
            // Determine the exact issue
            let issueType = 'conditional';
            if (ifParent)
                issueType = 'if statement';
            else if (ternaryParent)
                issueType = 'conditional (ternary) expression';
            else if (loopParent)
                issueType = 'loop';
            else if (isNestedFunction)
                issueType = 'nested function';
            issues.push({
                type: 'error',
                message: `Hook "${hookName}" cannot be called inside a ${issueType}`,
                filePath,
                line: hookCall.getStartLineNumber(),
                code: 'REACT19_CONDITIONAL_HOOK',
                framework: 'react',
                fix: {
                    type: 'complex',
                    transformer: 'moveHookToTopLevel',
                    context: {
                        hookName,
                        conditionalType: issueType,
                        startLine: hookCall.getStartLineNumber()
                    }
                },
                documentation: 'https://react.dev/warnings/invalid-hook-call-warning',
            });
        }
    }
    return issues;
}
/**
 * Validates head elements in JSX
 */
function validateHeadElementsInJSX(sourceFile, filePath) {
    const issues = [];
    // Check for direct manipulation of head elements
    const jsxElements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxElement);
    const jsxSelfClosingElements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxSelfClosingElement);
    // Helper function to check for head elements
    const checkHeadElements = (element, tagName) => {
        if (tagName === 'title' || tagName === 'meta' || tagName === 'link') {
            // Check if it's not inside a Head component
            const isInsideHead = !!element.getAncestors().find((ancestor) => {
                if (ts_morph_1.Node.isJsxElement(ancestor)) {
                    const openingElement = ancestor.getOpeningElement();
                    const tagName = openingElement.getTagNameNode().getText();
                    return tagName === 'Head' || tagName === 'head';
                }
                return false;
            });
            if (!isInsideHead) {
                // Check if using Next.js App Router by looking for metadata export in the file
                const hasMetadataExport = sourceFile.getVariableDeclaration('metadata') !== undefined ||
                    sourceFile.getFunction('generateMetadata') !== undefined;
                if (!hasMetadataExport) {
                    issues.push({
                        type: 'warning',
                        message: `Direct <${tagName}> elements should be inside a <Head> component or use metadata API`,
                        filePath,
                        line: element.getStartLineNumber(),
                        code: 'REACT19_HEAD_ELEMENTS_IN_JSX',
                        framework: 'react',
                        fix: {
                            type: 'manual',
                            description: 'Use Head component or metadata API',
                            steps: [
                                'For Next.js App Router: Use metadata API instead of direct JSX head elements',
                                'For Pages Router or other frameworks: Import Head component and wrap head elements',
                                `<Head>
  <${tagName}>...</${tagName}>
</Head>`
                            ]
                        },
                        documentation: 'https://nextjs.org/docs/app/building-your-application/optimizing/metadata',
                    });
                }
            }
        }
    };
    // Check regular elements
    for (const element of jsxElements) {
        const openingElement = element.getOpeningElement();
        const tagName = openingElement.getTagNameNode().getText();
        checkHeadElements(element, tagName);
    }
    // Check self-closing elements
    for (const element of jsxSelfClosingElements) {
        const tagName = element.getTagNameNode().getText();
        checkHeadElements(element, tagName);
    }
    return issues;
}
/**
 * Validates suspense boundaries
 */
function validateSuspenseBoundaries(sourceFile, filePath) {
    const issues = [];
    // Check if this file imports the 'use' hook
    const importsUseHook = sourceFile.getImportDeclarations().some(importDecl => {
        if (importDecl.getModuleSpecifierValue() === 'react') {
            const namedImports = importDecl.getNamedImports();
            return namedImports.some(imp => imp.getName() === 'use');
        }
        return false;
    });
    // Check for use of async components or use hook
    if (importsUseHook) {
        // Look for use calls
        const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
        const useCalls = callExpressions.filter(call => {
            const expression = call.getExpression();
            return ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'use';
        });
        for (const useCall of useCalls) {
            // Check if the use call is inside a Suspense component
            const isInsideSuspense = !!useCall.getAncestors().find((ancestor) => {
                if (ts_morph_1.Node.isJsxElement(ancestor)) {
                    const openingElement = ancestor.getOpeningElement();
                    const tagName = openingElement.getTagNameNode().getText();
                    return tagName === 'Suspense';
                }
                return false;
            });
            if (!isInsideSuspense) {
                issues.push({
                    type: 'warning',
                    message: 'use() hook should be wrapped in a Suspense boundary',
                    filePath,
                    line: useCall.getStartLineNumber(),
                    code: 'REACT19_MISSING_SUSPENSE',
                    framework: 'react',
                    fix: {
                        type: 'manual',
                        description: 'Wrap in Suspense boundary',
                        steps: [
                            "Import Suspense: import { Suspense } from 'react';",
                            'Wrap component or JSX with Suspense:',
                            `<Suspense fallback={<div>Loading...</div>}>
  {/* Component using use() hook */}
</Suspense>`
                        ]
                    },
                    documentation: 'https://react.dev/reference/react/Suspense',
                });
            }
        }
    }
    // Check for async components
    const functions = sourceFile.getFunctions();
    const asyncComponents = functions.filter(func => {
        return func.isAsync() && doesFunctionReturnJsx(func);
    });
    // Also check arrow functions
    const variables = sourceFile.getVariableDeclarations();
    for (const variable of variables) {
        const initializer = variable.getInitializer();
        if (ts_morph_1.Node.isArrowFunction(initializer) && initializer.isAsync() && doesArrowFunctionReturnJsx(initializer)) {
            // Check if this async arrow function is used as a component
            const variableName = variable.getName();
            // Look for JSX usage of this component in the file
            const jsxElements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxElement);
            const jsxSelfClosingElements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxSelfClosingElement);
            const isUsedAsComponent = [...jsxElements, ...jsxSelfClosingElements].some(element => {
                let tagName;
                if (ts_morph_1.Node.isJsxElement(element)) {
                    tagName = element.getOpeningElement().getTagNameNode();
                }
                else if (ts_morph_1.Node.isJsxSelfClosingElement(element)) {
                    tagName = element.getTagNameNode();
                }
                return tagName && tagName.getText() === variableName;
            });
            if (isUsedAsComponent) {
                issues.push({
                    type: 'warning',
                    message: `Async component "${variableName}" should be wrapped in a Suspense boundary when used`,
                    filePath,
                    line: variable.getStartLineNumber(),
                    code: 'REACT19_ASYNC_COMPONENT_WITHOUT_SUSPENSE',
                    framework: 'react',
                    fix: {
                        type: 'manual',
                        description: 'Wrap component in Suspense boundary',
                        steps: [
                            "Import Suspense: import { Suspense } from 'react';",
                            'Wrap component usage with Suspense:',
                            `<Suspense fallback={<div>Loading...</div>}>
  <${variableName} />
</Suspense>`
                        ]
                    },
                    documentation: 'https://react.dev/reference/react/Suspense',
                });
            }
        }
    }
    for (const component of asyncComponents) {
        const componentName = component.getName() || 'AsyncComponent';
        issues.push({
            type: 'warning',
            message: `Async component "${componentName}" should be wrapped in a Suspense boundary when used`,
            filePath,
            line: component.getStartLineNumber(),
            code: 'REACT19_ASYNC_COMPONENT_WITHOUT_SUSPENSE',
            framework: 'react',
            fix: {
                type: 'manual',
                description: 'Wrap component in Suspense boundary',
                steps: [
                    "Import Suspense: import { Suspense } from 'react';",
                    'Wrap component usage with Suspense:',
                    `<Suspense fallback={<div>Loading...</div>}>
  <${componentName} />
</Suspense>`
                ]
            },
            documentation: 'https://react.dev/reference/react/Suspense',
        });
    }
    return issues;
}
/**
 * Checks if a string is PascalCase
 */
function isPascalCase(str) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
}
/**
 * Converts a string to PascalCase
 */
function toPascalCase(str) {
    return str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
