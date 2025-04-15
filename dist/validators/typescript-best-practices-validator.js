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
exports.validateTypeScriptBestPractices = validateTypeScriptBestPractices;
const path = __importStar(require("path"));
const fs_1 = require("../utils/fs");
const ts_morph_1 = require("ts-morph");
/**
 * Validates TypeScript best practices that we've learned from fixing errors
 */
async function validateTypeScriptBestPractices(context) {
    const issues = [];
    console.log('Validating TypeScript best practices...');
    // Get all TypeScript files
    const srcPath = path.join(context.rootDir, 'src');
    const tsFiles = await (0, fs_1.getFilesWithExtension)(srcPath, ['.ts', '.tsx']);
    const filteredTsFiles = tsFiles.filter(file => !file.includes('.test.') && !file.includes('.spec.'));
    console.log(`Found ${filteredTsFiles.length} TypeScript files to validate`);
    // Create a ts-morph project for analysis
    const project = new ts_morph_1.Project({
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
    });
    // Process each file
    for (const file of filteredTsFiles) {
        console.log(`Analyzing TypeScript best practices in: ${path.relative(context.rootDir, file)}`);
        try {
            const sourceFile = project.addSourceFileAtPath(file);
            // Check for namespace imports
            const namespaceImportIssues = validateNamespaceImports(sourceFile, file);
            issues.push(...namespaceImportIssues);
            // Check for proper parseFile usage
            const parseFileIssues = validateParseFileUsage(sourceFile, file);
            issues.push(...parseFileIssues);
            // Check for proper node typing
            const nodeTypingIssues = validateNodeTyping(sourceFile, file);
            issues.push(...nodeTypingIssues);
            // Check for proper RegExp usage
            const regexpIssues = validateRegExpUsage(sourceFile, file);
            issues.push(...regexpIssues);
            // Check for potential undefined values
            const undefinedIssues = validateUndefinedHandling(sourceFile, file);
            issues.push(...undefinedIssues);
            // Check for proper Object.assign usage
            const objectAssignIssues = validateObjectAssign(sourceFile, file);
            issues.push(...objectAssignIssues);
        }
        catch (error) {
            console.error(`Error analyzing file ${file}:`, error);
        }
    }
    return {
        valid: issues.length === 0,
        issues,
    };
}
/**
 * Validates namespace imports for Node.js standard libraries
 */
function validateNamespaceImports(sourceFile, filePath) {
    const issues = [];
    const importDeclarations = sourceFile.getImportDeclarations();
    for (const importDecl of importDeclarations) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        // Check for Node.js standard libraries
        if (['path', 'fs', 'os', 'util', 'child_process', 'crypto', 'events', 'http', 'https', 'net', 'stream', 'url', 'zlib']
            .includes(moduleSpecifier)) {
            const defaultImport = importDecl.getDefaultImport();
            const namespaceImport = importDecl.getNamespaceImport();
            // If using default import instead of namespace import
            if (defaultImport && !namespaceImport) {
                issues.push({
                    type: 'error',
                    message: `Use namespace import for Node.js module: import * as ${moduleSpecifier} from '${moduleSpecifier}'`,
                    filePath,
                    line: importDecl.getStartLineNumber(),
                    code: 'TS_BEST_NAMESPACE_IMPORT',
                    framework: 'typescript',
                    fix: {
                        type: 'manual',
                        description: `Replace default import with namespace import`,
                        steps: [
                            `Change: import ${defaultImport.getText()} from '${moduleSpecifier}'`,
                            `To: import * as ${defaultImport.getText()} from '${moduleSpecifier}'`
                        ]
                    },
                    documentation: 'https://nodejs.org/api/esm.html#commonjs-namespaces',
                });
            }
        }
    }
    return issues;
}
/**
 * Validates proper parseFile usage
 */
function validateParseFileUsage(sourceFile, filePath) {
    var _a;
    const issues = [];
    // Step 1: Find variables assigned from parseFile calls
    const parseFileVariables = new Set();
    // Look for all calls to parseFile
    const callExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
    for (const callExpr of callExpressions) {
        const exprText = callExpr.getExpression().getText();
        if (exprText === 'parseFile' || exprText.endsWith('.parseFile') || exprText.includes('parseFile')) {
            // Find variables that store parseFile results
            const parent = callExpr.getParent();
            if (ts_morph_1.Node.isVariableDeclaration(parent) || ts_morph_1.Node.isPropertyAssignment(parent)) {
                const variableName = ts_morph_1.Node.isVariableDeclaration(parent)
                    ? parent.getName()
                    : ts_morph_1.Node.isPropertyAssignment(parent)
                        ? parent.getName()
                        : '';
                if (variableName) {
                    parseFileVariables.add(variableName);
                }
            }
            // Also check for awaited calls in variable declarations
            if (ts_morph_1.Node.isAwaitExpression(callExpr.getParent())) {
                const awaitParent = (_a = callExpr.getParent()) === null || _a === void 0 ? void 0 : _a.getParent();
                if (ts_morph_1.Node.isVariableDeclaration(awaitParent)) {
                    const variableName = awaitParent.getName();
                    if (variableName) {
                        parseFileVariables.add(variableName);
                    }
                }
            }
        }
    }
    // Step 2: Find problematic usages of these variables
    if (parseFileVariables.size > 0) {
        for (const varName of parseFileVariables) {
            // Find all identifiers that match our parseFile result variables
            const identifiers = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.Identifier)
                .filter(id => id.getText() === varName);
            for (const id of identifiers) {
                const propAccess = id.getParent();
                if (ts_morph_1.Node.isPropertyAccessExpression(propAccess)) {
                    const propName = propAccess.getName();
                    if (propName === 'includes') {
                        issues.push({
                            type: 'error',
                            message: `Use ${varName}.content.includes() instead of ${varName}.includes() with parseFile results`,
                            filePath,
                            line: propAccess.getStartLineNumber(),
                            code: 'TS_BEST_PARSE_FILE_CONTENT',
                            framework: 'typescript',
                            fix: {
                                type: 'manual',
                                description: 'Access content property before calling includes',
                                steps: [
                                    `Change: ${varName}.includes()`,
                                    `To: ${varName}.content.includes()`
                                ]
                            },
                            documentation: '/docs/typescript-error-prevention.md#file-system-access',
                        });
                    }
                }
            }
        }
    }
    return issues;
}
/**
 * Validates proper node typing with ts-morph
 */
function validateNodeTyping(sourceFile, filePath) {
    var _a;
    const issues = [];
    // Check for ts-morph import
    if (!sourceFile.getText().includes('ts-morph')) {
        return issues;
    }
    // Look for node.isX() method calls instead of Node.isX(node)
    const propAccesses = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.PropertyAccessExpression);
    for (const propAccess of propAccesses) {
        const propName = propAccess.getName();
        if (propName.startsWith('is') && ((_a = propName[2]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === propName[2]) {
            const parent = propAccess.getParent();
            if (ts_morph_1.Node.isCallExpression(parent)) {
                issues.push({
                    type: 'error',
                    message: `Use Node.${propName}(node) instead of node.${propName}()`,
                    filePath,
                    line: propAccess.getStartLineNumber(),
                    code: 'TS_BEST_NODE_IS_TYPE',
                    framework: 'typescript',
                    fix: {
                        type: 'manual',
                        description: 'Use correct ts-morph Node type checking',
                        steps: [
                            `Change: node.${propName}()`,
                            `To: Node.${propName}(node)`
                        ]
                    },
                    documentation: '/docs/typescript-error-prevention.md#working-with-ts-morph',
                });
            }
        }
    }
    return issues;
}
/**
 * Validates proper RegExp usage
 */
function validateRegExpUsage(sourceFile, filePath) {
    const issues = [];
    // Look for RegExp constructor calls
    const newExpressions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.NewExpression);
    for (const newExpr of newExpressions) {
        const exprText = newExpr.getExpression().getText();
        if (exprText === 'RegExp') {
            const args = newExpr.getArguments();
            if (args.length > 0) {
                const firstArg = args[0];
                // Check if the first argument is a direct reference without type checking
                if (!firstArg.getText().includes('typeof') && !firstArg.getText().includes('as')) {
                    issues.push({
                        type: 'warning',
                        message: 'Ensure RegExp pattern is properly type-checked',
                        filePath,
                        line: newExpr.getStartLineNumber(),
                        code: 'TS_BEST_REGEXP_TYPING',
                        framework: 'typescript',
                        fix: {
                            type: 'manual',
                            description: 'Add type checking for RegExp parameters',
                            steps: [
                                `Add type check: typeof pattern === 'string' ? pattern : ''`,
                                'Apply similar checks to all RegExp constructor parameters'
                            ]
                        },
                        documentation: '/docs/typescript-error-prevention.md#regular-expression-usage',
                    });
                }
            }
        }
    }
    return issues;
}
/**
 * Validates proper handling of potentially undefined values
 */
function validateUndefinedHandling(sourceFile, filePath) {
    const issues = [];
    // Step 1: Find interface or type definitions with optional properties
    const optionalPropertyOwners = new Map();
    // Check interfaces
    const interfaces = sourceFile.getInterfaces();
    for (const intf of interfaces) {
        const name = intf.getName();
        const optionalProps = [];
        // Find optional properties
        const properties = intf.getProperties();
        for (const prop of properties) {
            if (prop.hasQuestionToken()) {
                optionalProps.push(prop.getName());
            }
        }
        if (optionalProps.length > 0) {
            optionalPropertyOwners.set(name, optionalProps);
        }
    }
    // Check type aliases
    const typeAliases = sourceFile.getTypeAliases();
    for (const typeAlias of typeAliases) {
        const name = typeAlias.getName();
        const typeText = typeAlias.getType().getText();
        // Simple regex check for optional properties in type text
        const optionalPropsMatch = typeText.match(/(\w+)\?:/g);
        if (optionalPropsMatch) {
            const optionalProps = optionalPropsMatch.map(match => match.replace('?:', ''));
            optionalPropertyOwners.set(name, optionalProps);
        }
    }
    // Step 2: Look for unsafe property accesses
    const propAccesses = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.PropertyAccessExpression);
    for (const propAccess of propAccesses) {
        // Get the parent chain to check for conditionals or nullish coalescing
        let currentNode = propAccess.getParent();
        let hasSafetyCheck = false;
        while (currentNode && !hasSafetyCheck) {
            if (ts_morph_1.Node.isBinaryExpression(currentNode) &&
                ['??', '||', '&&'].includes(currentNode.getOperatorToken().getText())) {
                hasSafetyCheck = true;
            }
            else if (ts_morph_1.Node.isIfStatement(currentNode) || ts_morph_1.Node.isConditionalExpression(currentNode)) {
                hasSafetyCheck = true;
            }
            else if (ts_morph_1.Node.isPropertyAccessExpression(currentNode) && currentNode.getName() === 'optional') {
                hasSafetyCheck = true; // Props with .optional chaining are safe
            }
            currentNode = currentNode.getParent();
        }
        // Check if the property access is directly accessing an optional property
        // or if the target object's type is nullable
        if (!hasSafetyCheck) {
            const objText = propAccess.getExpression().getText();
            const propName = propAccess.getName();
            // Standard null check from existing code
            if (propAccess.getExpression().getType().isNullable()) {
                issues.push({
                    type: 'warning',
                    message: `Add null check for potentially undefined property access: ${objText}.${propName}`,
                    filePath,
                    line: propAccess.getStartLineNumber(),
                    code: 'TS_BEST_UNDEFINED_CHECK',
                    framework: 'typescript',
                    fix: {
                        type: 'manual',
                        description: 'Add null checks for potentially undefined values',
                        steps: [
                            `Use nullish coalescing: ${objText}?.${propName} or ${objText} || defaultValue`,
                            `Or add a conditional check: if (${objText}) { ... }`
                        ]
                    },
                    documentation: '/docs/typescript-error-prevention.md#type-guards',
                });
            }
            // Special case for direct access to optional properties in a complex object
            if (objText.includes('.')) {
                const parts = objText.split('.');
                const baseObj = parts[0];
                const propChain = parts.slice(1);
                // Check object types in source code
                const declarations = sourceFile.getVariableDeclarations().filter(v => v.getName() === baseObj);
                let typeText = "";
                if (declarations.length > 0) {
                    const typeNode = declarations[0].getTypeNode();
                    if (typeNode) {
                        typeText = typeNode.getText();
                        // If this is a type that has optional properties
                        for (const [typeName, optionalProps] of optionalPropertyOwners.entries()) {
                            if (typeText.includes(typeName)) {
                                // Check if any property in the chain is listed as optional for this type
                                for (const chainProp of propChain) {
                                    if (optionalProps.includes(chainProp)) {
                                        // This property access includes an optional property in its chain
                                        issues.push({
                                            type: 'warning',
                                            message: `Add null check for optional property in chain: ${objText}.${propName}`,
                                            filePath,
                                            line: propAccess.getStartLineNumber(),
                                            code: 'TS_BEST_UNDEFINED_CHECK',
                                            framework: 'typescript',
                                            fix: {
                                                type: 'manual',
                                                description: 'Add null checks for optional properties',
                                                steps: [
                                                    `Use optional chaining: ${baseObj}${propChain.map(p => `?.${p}`).join('')}?.${propName}`,
                                                    `Or add explicit checks: if (${baseObj}${propChain.map(p => ` && ${baseObj}.${p}`).join('')}) { ... }`
                                                ]
                                            },
                                            documentation: '/docs/typescript-error-prevention.md#type-guards',
                                        });
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return issues;
}
/**
 * Validates proper Object.assign usage
 */
function validateObjectAssign(sourceFile, filePath) {
    const issues = [];
    // Look for Object.assign calls
    const propAccesses = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.PropertyAccessExpression);
    for (const propAccess of propAccesses) {
        if (propAccess.getText() === 'Object.assign') {
            const parent = propAccess.getParent();
            if (ts_morph_1.Node.isCallExpression(parent)) {
                // Check if there's a type assertion after the call
                const grandParent = parent.getParent();
                const hasTypeAssertion = ts_morph_1.Node.isAsExpression(grandParent);
                if (!hasTypeAssertion) {
                    issues.push({
                        type: 'warning',
                        message: 'Add type assertion to Object.assign call',
                        filePath,
                        line: propAccess.getStartLineNumber(),
                        code: 'TS_BEST_OBJECT_ASSIGN',
                        framework: 'typescript',
                        fix: {
                            type: 'manual',
                            description: 'Add type assertion to Object.assign',
                            steps: [
                                'Add a type assertion: Object.assign(obj, { method }) as YourType',
                                'Define a proper combined type for the result'
                            ]
                        },
                        documentation: '/docs/typescript-error-prevention.md#modifying-objects-with-object.assign',
                    });
                }
            }
        }
    }
    return issues;
}
