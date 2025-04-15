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
exports.validateTypeScript5Implementation = validateTypeScript5Implementation;
exports.convertToTypeOnlyImport = convertToTypeOnlyImport;
exports.convertToSatisfiesOperator = convertToSatisfiesOperator;
const path = __importStar(require("path"));
const ast_1 = require("../utils/ast");
const fs_1 = require("../utils/fs");
const ts_morph_1 = require("ts-morph");
/**
 * Validates TypeScript 5 implementation in a project
 */
async function validateTypeScript5Implementation(context) {
    const issues = [];
    console.log('Validating TypeScript 5 implementation...');
    // Check tsconfig.json
    const tsConfigIssues = await validateTsConfig(context);
    issues.push(...tsConfigIssues);
    // Check for VerbatimModuleSyntax
    const verbatimModuleSyntaxIssues = await validateVerbatimModuleSyntax(context);
    issues.push(...verbatimModuleSyntaxIssues);
    // Check for Satisfies Operator usage
    const satisfiesOperatorIssues = await validateSatisfiesOperator(context);
    issues.push(...satisfiesOperatorIssues);
    // Check for type-only imports
    const typeOnlyImportIssues = await validateTypeOnlyImports(context);
    issues.push(...typeOnlyImportIssues);
    // Get all TypeScript files
    const srcPath = path.join(context.rootDir, 'src');
    const tsFiles = await (0, fs_1.getFilesWithExtension)(srcPath, ['.ts', '.tsx']);
    const filteredTsFiles = tsFiles.filter(file => !file.includes('.test.') && !file.includes('.spec.'));
    console.log(`Found ${filteredTsFiles.length} TypeScript files to validate`);
    // Validate component typing patterns
    for (const file of filteredTsFiles) {
        console.log(`Analyzing TypeScript implementation in: ${path.relative(context.rootDir, file)}`);
        const parsedFile = await (0, ast_1.parseTypeScript)(file);
        // Check for React.FC usage
        const fcIssues = validateReactFC(parsedFile, file);
        issues.push(...fcIssues);
        // Check for proper prop interfaces
        const propIssues = validatePropInterfaces(parsedFile, file);
        issues.push(...propIssues);
        // Check for proper custom hook typing
        const hookIssues = validateHookTyping(parsedFile, file);
        issues.push(...hookIssues);
        // Check for proper context typing
        const contextIssues = validateContextTyping(parsedFile, file);
        issues.push(...contextIssues);
        // Check for advanced TypeScript patterns
        const advancedIssues = validateAdvancedPatterns(parsedFile, file);
        issues.push(...advancedIssues);
        // Check for type imports vs standard imports
        const importIssues = validateTypeImports(parsedFile, file);
        issues.push(...importIssues);
        // Check for proper JSDoc comments
        const jsdocIssues = validateJSDoc(parsedFile, file);
        issues.push(...jsdocIssues);
        // Check for const type parameters
        const constTypeParamsIssues = validateConstTypeParameters(parsedFile, file);
        issues.push(...constTypeParamsIssues);
        // Check for exactOptionalPropertyTypes
        const exactOptionalPropertyIssues = validateExactOptionalPropertyTypes(parsedFile, file);
        issues.push(...exactOptionalPropertyIssues);
    }
    return {
        valid: issues.length === 0,
        issues,
    };
}
/**
 * Validates tsconfig.json
 */
async function validateTsConfig(context) {
    var _a, _b, _c, _d, _e, _f;
    const issues = [];
    console.log('Checking TypeScript configuration...');
    const tsConfigPath = path.join(context.rootDir, 'tsconfig.json');
    const tsConfigExists = await (0, fs_1.fileExists)(tsConfigPath);
    if (!tsConfigExists) {
        issues.push({
            type: 'error',
            message: 'Missing tsconfig.json file',
            filePath: context.rootDir,
            line: 0,
            code: 'TS5_MISSING_TSCONFIG',
            framework: 'typescript',
            fix: {
                type: 'create_file',
                path: tsConfigPath,
                content: JSON.stringify({
                    "compilerOptions": {
                        "target": "es5",
                        "lib": ["dom", "dom.iterable", "esnext"],
                        "allowJs": true,
                        "skipLibCheck": true,
                        "strict": true,
                        "forceConsistentCasingInFileNames": true,
                        "noEmit": true,
                        "esModuleInterop": true,
                        "module": "esnext",
                        "moduleResolution": "bundler",
                        "resolveJsonModule": true,
                        "isolatedModules": true,
                        "jsx": "preserve",
                        "incremental": true,
                        "plugins": [
                            {
                                "name": "next"
                            }
                        ],
                        "paths": {
                            "@/*": ["./src/*"]
                        }
                    },
                    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
                    "exclude": ["node_modules"]
                }, null, 2),
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/tsconfig-json.html',
        });
        return issues;
    }
    // Parse tsconfig.json
    const tsConfig = await (0, fs_1.readJsonFile)(tsConfigPath);
    // Check for strict mode
    if (!((_a = tsConfig.compilerOptions) === null || _a === void 0 ? void 0 : _a.strict)) {
        issues.push({
            type: 'error',
            message: 'TypeScript strict mode is not enabled',
            filePath: tsConfigPath,
            line: 0,
            code: 'TS5_STRICT_MODE_DISABLED',
            framework: 'typescript',
            fix: {
                type: 'update_json',
                path: tsConfigPath,
                operations: [
                    {
                        path: 'compilerOptions.strict',
                        value: true,
                    },
                ],
            },
            documentation: 'https://www.typescriptlang.org/tsconfig#strict',
        });
    }
    // Check for module resolution
    if (((_b = tsConfig.compilerOptions) === null || _b === void 0 ? void 0 : _b.moduleResolution) !== 'bundler') {
        issues.push({
            type: 'warning',
            message: 'moduleResolution should be set to "bundler" for Next.js 15',
            filePath: tsConfigPath,
            line: 0,
            code: 'TS5_MODULE_RESOLUTION',
            framework: 'typescript',
            fix: {
                type: 'update_json',
                path: tsConfigPath,
                operations: [
                    {
                        path: 'compilerOptions.moduleResolution',
                        value: 'bundler',
                    },
                ],
            },
            documentation: 'https://www.typescriptlang.org/tsconfig#moduleResolution',
        });
    }
    // Check for paths configuration
    if (!((_c = tsConfig.compilerOptions) === null || _c === void 0 ? void 0 : _c.paths) || !tsConfig.compilerOptions.paths['@/*']) {
        issues.push({
            type: 'warning',
            message: 'Missing path alias configuration for "@/*"',
            filePath: tsConfigPath,
            line: 0,
            code: 'TS5_MISSING_PATH_ALIAS',
            framework: 'typescript',
            fix: {
                type: 'update_json',
                path: tsConfigPath,
                operations: [
                    {
                        path: 'compilerOptions.paths',
                        value: {
                            '@/*': ['./src/*'],
                            ...(((_d = tsConfig.compilerOptions) === null || _d === void 0 ? void 0 : _d.paths) || {})
                        },
                    },
                ],
            },
            documentation: 'https://www.typescriptlang.org/tsconfig#paths',
        });
    }
    // Check for other important settings
    const recommendations = [];
    if (!((_e = tsConfig.compilerOptions) === null || _e === void 0 ? void 0 : _e.forceConsistentCasingInFileNames)) {
        recommendations.push({
            path: 'compilerOptions.forceConsistentCasingInFileNames',
            value: true
        });
    }
    if (!((_f = tsConfig.compilerOptions) === null || _f === void 0 ? void 0 : _f.noUncheckedIndexedAccess)) {
        recommendations.push({
            path: 'compilerOptions.noUncheckedIndexedAccess',
            value: true
        });
    }
    if (recommendations.length > 0) {
        issues.push({
            type: 'suggestion',
            message: 'Consider additional recommended TypeScript compiler options',
            filePath: tsConfigPath,
            line: 0,
            code: 'TS5_RECOMMENDED_OPTIONS',
            framework: 'typescript',
            fix: {
                type: 'update_json',
                path: tsConfigPath,
                operations: recommendations,
            },
            documentation: 'https://typescript-eslint.io/linting/configs/#recommended-configurations',
        });
    }
    return issues;
}
/**
 * Validates React.FC usage
 */
function validateReactFC(parsedFile, filePath) {
    const issues = [];
    // Skip if not a React component file
    if (!parsedFile.isReactComponent) {
        return issues;
    }
    // Check for functional components without React.FC
    if (parsedFile.isFunctionalComponent && !parsedFile.usesReactFC) {
        issues.push({
            type: 'warning',
            message: 'Functional component should use React.FC type',
            filePath,
            line: parsedFile.componentDeclarationLine,
            code: 'TS5_MISSING_FC_TYPE',
            framework: 'typescript',
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
 * Validates prop interfaces
 */
function validatePropInterfaces(parsedFile, filePath) {
    const issues = [];
    // Skip if not a React component file
    if (!parsedFile.isReactComponent) {
        return issues;
    }
    // Check for component props without interface
    if (parsedFile.isFunctionalComponent && !parsedFile.hasPropInterface) {
        issues.push({
            type: 'error',
            message: 'Component props should be defined with a TypeScript interface',
            filePath,
            line: parsedFile.componentDeclarationLine,
            code: 'TS5_MISSING_PROPS_INTERFACE',
            framework: 'typescript',
            fix: {
                type: 'complex',
                transformer: 'addPropsInterface',
            },
            documentation: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components/',
        });
    }
    // Check for prop interface naming convention
    if (parsedFile.hasPropInterface && !parsedFile.propInterfaceName.endsWith('Props')) {
        issues.push({
            type: 'warning',
            message: `Prop interface "${parsedFile.propInterfaceName}" should end with "Props"`,
            filePath,
            line: parsedFile.propInterfaceLine,
            code: 'TS5_PROP_INTERFACE_NAMING',
            framework: 'typescript',
            fix: {
                type: 'complex',
                transformer: 'renamePropInterface',
            },
            documentation: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components/',
        });
    }
    // Check for props without types
    if (parsedFile.hasUntypedProps) {
        issues.push({
            type: 'error',
            message: 'All component props should have explicit types',
            filePath,
            line: parsedFile.untypedPropsLine,
            code: 'TS5_UNTYPED_PROPS',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Add types to component props',
                steps: [
                    'Identify props without types in the interface',
                    'Add appropriate types to each prop',
                ]
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/2/objects.html',
        });
    }
    return issues;
}
/**
 * Validates hook typing
 */
function validateHookTyping(parsedFile, filePath) {
    const issues = [];
    // Skip if not a hook file
    if (!parsedFile.isHook) {
        return issues;
    }
    // Check for hooks without return type
    if (!parsedFile.hasHookReturnType) {
        issues.push({
            type: 'warning',
            message: 'Custom hook should have explicit return type',
            filePath,
            line: parsedFile.hookDeclarationLine,
            code: 'TS5_MISSING_HOOK_RETURN_TYPE',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Add return type to hook',
                steps: [
                    'Identify the hook return value structure',
                    'Define a return type for the hook',
                    'Add it to the function signature'
                ]
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#return-type-annotations',
        });
    }
    // Check for hooks with generic parameters
    if (parsedFile.hasHookGenericParams && parsedFile.hasWeakGenericConstraints) {
        issues.push({
            type: 'warning',
            message: 'Hook generic parameters should have constraints',
            filePath,
            line: parsedFile.hookGenericParamsLine,
            code: 'TS5_WEAK_GENERIC_CONSTRAINTS',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Add constraints to generic parameters',
                steps: [
                    'Identify generic parameters without constraints',
                    'Add appropriate constraints (e.g., T extends object)',
                ]
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints',
        });
    }
    return issues;
}
/**
 * Validates context typing
 */
function validateContextTyping(parsedFile, filePath) {
    const issues = [];
    // Skip if not a context file
    if (!parsedFile.isContextProvider) {
        return issues;
    }
    // Check for context without explicit type
    if (!parsedFile.hasContextType) {
        issues.push({
            type: 'error',
            message: 'Context should have explicit type',
            filePath,
            line: parsedFile.contextDeclarationLine,
            code: 'TS5_UNTYPED_CONTEXT',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Add type to context',
                steps: [
                    'Define an interface for the context value',
                    'Use the interface in createContext<ContextType>()'
                ]
            },
            documentation: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/',
        });
    }
    // Check for context default value
    if (!parsedFile.hasContextDefaultValue) {
        issues.push({
            type: 'warning',
            message: 'Context should have a proper default value',
            filePath,
            line: parsedFile.contextDeclarationLine,
            code: 'TS5_MISSING_CONTEXT_DEFAULT',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Add default value to context',
                steps: [
                    'Create a proper default value that matches the context type',
                    'Pass the default value to createContext'
                ]
            },
            documentation: 'https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/',
        });
    }
    return issues;
}
/**
 * Validates advanced TypeScript patterns
 */
function validateAdvancedPatterns(parsedFile, filePath) {
    const issues = [];
    // Check for 'any' type usage
    if (parsedFile.usesAnyType) {
        issues.push({
            type: 'warning',
            message: 'Avoid using the "any" type when possible',
            filePath,
            line: parsedFile.anyTypeLine,
            code: 'TS5_USES_ANY_TYPE',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Replace "any" with more specific types',
                steps: [
                    'Identify variables with "any" type',
                    'Replace with more specific types like unknown, Record<string, unknown>, etc.',
                ]
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html#any',
        });
    }
    // Check for proper utility types
    if (parsedFile.shouldUseUtilityTypes) {
        issues.push({
            type: 'suggestion',
            message: 'Consider using TypeScript utility types',
            filePath,
            line: parsedFile.utilityTypeCandidateLine,
            code: 'TS5_MISSING_UTILITY_TYPES',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Use TypeScript utility types',
                steps: [
                    'Identify patterns that could use utility types',
                    'Replace with appropriate utility types (Partial, Omit, Pick, etc.)',
                ]
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/utility-types.html',
        });
    }
    // Check for complex inline types
    if (parsedFile.hasComplexInlineTypes) {
        issues.push({
            type: 'suggestion',
            message: 'Complex inline types should be extracted to named interfaces',
            filePath,
            line: parsedFile.complexInlineTypeLine,
            code: 'TS5_COMPLEX_INLINE_TYPES',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Extract complex inline types',
                steps: [
                    'Identify complex inline types',
                    'Extract to named interfaces or type aliases',
                    'Replace inline types with references to named types'
                ]
            },
            documentation: 'https://typescript-eslint.io/rules/prefer-type-alias/',
        });
    }
    return issues;
}
/**
 * Validates type imports vs standard imports
 */
function validateTypeImports(parsedFile, filePath) {
    const issues = [];
    // Check for type-only imports without 'import type'
    if (parsedFile.hasTypeOnlyImportsWithoutTypeKeyword) {
        issues.push({
            type: 'suggestion',
            message: 'Use "import type" for type-only imports',
            filePath,
            line: parsedFile.typeOnlyImportLine,
            code: 'TS5_MISSING_IMPORT_TYPE',
            framework: 'typescript',
            fix: {
                type: 'complex',
                transformer: 'addImportType',
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-exports',
        });
    }
    return issues;
}
/**
 * Validates JSDoc comments
 */
function validateJSDoc(parsedFile, filePath) {
    const issues = [];
    // Check for exported functions without JSDoc
    if (parsedFile.hasExportedFunctionsWithoutJSDoc) {
        issues.push({
            type: 'suggestion',
            message: 'Add JSDoc comments to exported functions',
            filePath,
            line: parsedFile.exportedFunctionLine,
            code: 'TS5_MISSING_JSDOC',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Add JSDoc comments',
                steps: [
                    'Add JSDoc comments to exported functions',
                    'Include parameter descriptions and return value description'
                ]
            },
            documentation: 'https://tsdoc.org/',
        });
    }
    // Check for interfaces without property descriptions
    if (parsedFile.hasInterfacePropsWithoutJSDoc) {
        issues.push({
            type: 'suggestion',
            message: 'Add JSDoc comments to interface properties',
            filePath,
            line: parsedFile.interfaceWithoutJSDocLine,
            code: 'TS5_INTERFACE_WITHOUT_JSDOC',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Add JSDoc comments to interface properties',
                steps: [
                    'Add /** Description */ comments above each property',
                ]
            },
            documentation: 'https://tsdoc.org/',
        });
    }
    return issues;
}
/**
 * Validates const type parameters usage (TypeScript 5.0 feature)
 */
function validateConstTypeParameters(parsedFile, filePath) {
    const issues = [];
    // Skip if file has no type parameters
    if (!parsedFile.hasHookGenericParams && !parsedFile.hasComplexInlineTypes) {
        return issues;
    }
    // This would check for cases where const type parameters would be beneficial
    // For example: functions that use literal types in generic positions
    if (parsedFile.couldUseConstTypeParams) {
        issues.push({
            type: 'suggestion',
            message: 'Consider using const type parameters for improved type inference',
            filePath,
            line: parsedFile.constTypeParamCandidateLine || 1,
            code: 'TS5_CONST_TYPE_PARAMS',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Add const modifier to type parameters',
                steps: [
                    'Add const before the type parameter list where literal type inference is needed',
                    'Example: function example<const T extends string[]>(args: T)'
                ]
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters',
        });
    }
    return issues;
}
/**
 * Validates VerbatimModuleSyntax (TypeScript 5.0 feature)
 */
async function validateVerbatimModuleSyntax(context) {
    var _a;
    const issues = [];
    const tsConfigPath = path.join(context.rootDir, 'tsconfig.json');
    const tsConfigExists = await (0, fs_1.fileExists)(tsConfigPath);
    if (!tsConfigExists) {
        return issues; // Already handled in validateTsConfig
    }
    // Parse tsconfig.json
    const tsConfig = await (0, fs_1.readJsonFile)(tsConfigPath);
    // Check for verbatimModuleSyntax
    if (((_a = tsConfig.compilerOptions) === null || _a === void 0 ? void 0 : _a.verbatimModuleSyntax) !== true) {
        issues.push({
            type: 'warning',
            message: 'TypeScript 5.0 verbatimModuleSyntax is not enabled',
            filePath: tsConfigPath,
            line: 0,
            code: 'TS5_VERBATIM_MODULE_SYNTAX',
            framework: 'typescript',
            fix: {
                type: 'update_json',
                path: tsConfigPath,
                operations: [
                    {
                        path: 'compilerOptions.verbatimModuleSyntax',
                        value: true,
                    },
                ],
            },
            documentation: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#verbatimmodulesyntax',
        });
    }
    return issues;
}
/**
 * Validates usage of the satisfies operator (TypeScript 4.9+ feature, but important for TS5 projects)
 */
async function validateSatisfiesOperator(context) {
    const issues = [];
    // Get all TypeScript files
    const srcPath = path.join(context.rootDir, 'src');
    const tsFiles = await (0, fs_1.getFilesWithExtension)(srcPath, ['.ts', '.tsx']);
    const filteredTsFiles = tsFiles.filter(file => !file.includes('.test.') && !file.includes('.spec.'));
    for (const filePath of filteredTsFiles) {
        // Skip checking for files that already use satisfies
        const content = await (0, fs_1.readFile)(filePath);
        if (content.includes('satisfies')) {
            continue; // Already using satisfies operator
        }
        const sourceFile = context.project.getSourceFile(filePath);
        if (!sourceFile)
            continue;
        // Look for variable declarations with explicit type annotations that could benefit from satisfies
        const variableDeclarations = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.VariableDeclaration)
            .filter(decl => {
            // Has object literal initializer and type annotation
            const initializer = decl.getInitializer();
            const hasTypeAnnotation = decl.getTypeNode() !== undefined;
            // Check if it's an object or array literal
            return hasTypeAnnotation &&
                initializer &&
                (ts_morph_1.Node.isObjectLiteralExpression(initializer) ||
                    ts_morph_1.Node.isArrayLiteralExpression(initializer));
        });
        if (variableDeclarations.length > 0) {
            // Find the first candidate for improvement
            const declaration = variableDeclarations[0];
            const name = declaration.getName();
            issues.push({
                type: 'suggestion',
                message: `Variable "${name}" could use the satisfies operator for better type inference`,
                filePath,
                line: declaration.getStartLineNumber(),
                code: 'TS5_USE_SATISFIES',
                framework: 'typescript',
                fix: {
                    type: 'complex',
                    transformer: 'convertToSatisfiesOperator',
                    context: {
                        variableName: name,
                        line: declaration.getStartLineNumber()
                    }
                },
                documentation: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator',
            });
        }
    }
    return issues;
}
/**
 * Validates type-only imports in TypeScript files
 */
async function validateTypeOnlyImports(context) {
    const issues = [];
    // Get all TypeScript files
    const srcPath = path.join(context.rootDir, 'src');
    const tsFiles = await (0, fs_1.getFilesWithExtension)(srcPath, ['.ts', '.tsx']);
    const filteredTsFiles = tsFiles.filter(file => !file.includes('.test.') && !file.includes('.spec.'));
    for (const filePath of filteredTsFiles) {
        const sourceFile = context.project.getSourceFile(filePath);
        if (!sourceFile)
            continue;
        // Get all import declarations
        const importDeclarations = sourceFile.getImportDeclarations();
        for (const importDecl of importDeclarations) {
            // Skip if it's already a type-only import
            if (importDecl.isTypeOnly())
                continue;
            // Get named imports
            const namedImports = importDecl.getNamedImports();
            const importedSymbols = namedImports.map(ni => ni.getName());
            // Skip if no named imports
            if (importedSymbols.length === 0)
                continue;
            // Check if all imported symbols are only used in type positions
            const allTypeOnly = importedSymbols.every(symbol => {
                const references = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.Identifier)
                    .filter(id => id.getText() === symbol);
                // Skip if no references (unused import)
                if (references.length === 0)
                    return true;
                // Check if all references are in type positions
                return references.every(ref => {
                    const parent = ref.getParent();
                    if (!parent)
                        return false;
                    // Check for common type contexts
                    return ts_morph_1.Node.isTypeReference(parent) ||
                        ts_morph_1.Node.isTypeAliasDeclaration(parent) ||
                        ts_morph_1.Node.isInterfaceDeclaration(parent) ||
                        ts_morph_1.Node.isTypeParameterDeclaration(parent) ||
                        ts_morph_1.Node.isPropertySignature(parent) ||
                        ts_morph_1.Node.isMethodSignature(parent) ||
                        (ts_morph_1.Node.isImportSpecifier(parent) && parent.isTypeOnly());
                });
            });
            if (allTypeOnly && importedSymbols.length > 0) {
                issues.push({
                    type: 'suggestion',
                    message: `Import from "${importDecl.getModuleSpecifierValue()}" can be converted to a type-only import`,
                    filePath,
                    line: importDecl.getStartLineNumber(),
                    code: 'TS5_TYPE_ONLY_IMPORT',
                    framework: 'typescript',
                    fix: {
                        type: 'complex',
                        transformer: 'convertToTypeOnlyImport',
                        context: {
                            importDeclaration: importDecl.getFullText(),
                            line: importDecl.getStartLineNumber()
                        }
                    },
                    documentation: 'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-exports',
                });
            }
        }
    }
    return issues;
}
/**
 * Validates exactOptionalPropertyTypes in TypeScript files
 */
function validateExactOptionalPropertyTypes(parsedFile, filePath) {
    const issues = [];
    // Check for interfaces with optional properties
    if (parsedFile.hasInterfaceWithOptionalProps) {
        // Check if exactOptionalPropertyTypes is enabled in tsconfig
        issues.push({
            type: 'suggestion',
            message: 'Consider enabling exactOptionalPropertyTypes in tsconfig.json for stricter optional property checking',
            filePath,
            line: parsedFile.interfaceWithOptionalPropsLine || 1,
            code: 'TS5_EXACT_OPTIONAL_PROPERTY_TYPES',
            framework: 'typescript',
            fix: {
                type: 'manual',
                description: 'Enable exactOptionalPropertyTypes in tsconfig.json',
                steps: [
                    'Add "exactOptionalPropertyTypes": true to compilerOptions in tsconfig.json',
                    'This ensures that optional properties cannot be assigned undefined explicitly'
                ]
            },
            documentation: 'https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes',
        });
    }
    return issues;
}
/**
 * Transformer function to convert regular imports to type-only imports
 * Can be registered as a fix transformer
 */
function convertToTypeOnlyImport(content, context) {
    const lines = content.split('\n');
    const importLine = lines[context.line - 1];
    // Simple transformation for common import patterns
    if (importLine.includes('import {')) {
        // Convert 'import { Type } from "module";' to 'import type { Type } from "module";'
        const newImportLine = importLine.replace('import {', 'import type {');
        lines[context.line - 1] = newImportLine;
    }
    else if (importLine.includes('import')) {
        // Handle default imports or other patterns
        // This is a simplified version that works for common cases
        const importIndex = importLine.indexOf('import');
        const newImportLine = importLine.substring(0, importIndex) +
            'import type ' +
            importLine.substring(importIndex + 'import'.length);
        lines[context.line - 1] = newImportLine;
    }
    return lines.join('\n');
}
/**
 * Transformer function to convert a variable declaration with type annotation to use the satisfies operator
 * Can be registered as a fix transformer
 */
function convertToSatisfiesOperator(content, context) {
    const lines = content.split('\n');
    const variableLine = lines[context.line - 1];
    const variableName = context.variableName;
    // Look for variable declaration pattern: const varName: Type = value;
    const colonIndex = variableLine.indexOf(':');
    const equalsIndex = variableLine.indexOf('=');
    if (colonIndex > 0 && equalsIndex > colonIndex) {
        // Extract parts of the declaration
        const prefix = variableLine.substring(0, colonIndex).trim();
        const typeAnnotation = variableLine.substring(colonIndex + 1, equalsIndex).trim();
        const valueAssignment = variableLine.substring(equalsIndex).trim();
        // Create new declaration with satisfies: const varName = value satisfies Type;
        const newLine = `${prefix} ${valueAssignment.replace(';', '')} satisfies ${typeAnnotation};`;
        lines[context.line - 1] = newLine;
    }
    return lines.join('\n');
}
