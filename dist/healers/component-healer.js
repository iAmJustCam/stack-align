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
exports.healComponent = healComponent;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ts_morph_1 = require("ts-morph");
const ast_1 = require("../utils/ast");
const fs_1 = require("../utils/fs");
const test_generation_engine_1 = require("./test-generation-engine");
/**
 * Heals a React component to make it compliant with best practices
 *
 * @param componentPath Path to the component file
 * @param issues ValidationIssues to fix
 * @param options Healing options
 */
async function healComponent(componentPath, issues, options = {}) {
    // Read the original component
    const content = await (0, fs_1.readFile)(componentPath);
    // Create a ts-morph project for this component
    const project = new ts_morph_1.Project({
        skipAddingFilesFromTsConfig: true,
        skipFileDependencyResolution: true,
    });
    // Add the component file to the project
    const sourceFile = (0, ast_1.addSourceFile)(project, componentPath);
    if (!sourceFile) {
        throw new Error(`Failed to parse component file: ${componentPath}`);
    }
    // Get component context
    const componentContext = extractComponentContext(sourceFile, componentPath);
    // Apply transformations based on issues
    const operations = [];
    // First, check if we need to move the file to src directory
    let finalComponentPath = componentPath;
    if (options.moveToSrc && !componentPath.includes('/src/')) {
        const parsedPath = path.parse(componentPath);
        const relativePath = parsedPath.dir.split('/').pop() || '';
        const newDir = path.join('src', relativePath === 'components' ? 'components' : 'components', parsedPath.name.toLowerCase());
        const newPath = path.join(newDir, parsedPath.name.toLowerCase() + parsedPath.ext);
        // Create directory if it doesn't exist
        if (!await (0, fs_1.fileExists)(newDir) && !options.dryRun) {
            await fs.promises.mkdir(newDir, { recursive: true });
        }
        operations.push({
            type: 'move_file',
            oldPath: componentPath,
            newPath,
            success: true,
            description: `Moved component to ${newPath}`,
        });
        finalComponentPath = newPath;
    }
    // Handle file extension and migration to TypeScript
    if (options.migrateToTypeScript && !finalComponentPath.endsWith('.tsx')) {
        const newPath = finalComponentPath.replace(/\.(jsx|js)$/, '.tsx');
        operations.push({
            type: 'rename_file',
            oldPath: finalComponentPath,
            newPath,
            success: true,
            description: `Migrated file to TypeScript: ${newPath}`,
        });
        finalComponentPath = newPath;
    }
    // Group issues by framework for ordered processing
    const issuesByFramework = groupIssuesByFramework(issues);
    // Process TypeScript issues first (they may define types needed for React fixes)
    if (issuesByFramework.typescript) {
        const result = await applyTypeScriptFixes(sourceFile, componentContext, issuesByFramework.typescript);
        if (result) {
            operations.push({
                type: 'typescript_transformation',
                path: finalComponentPath,
                success: true,
                description: 'Applied TypeScript transformations',
            });
        }
    }
    // Process React issues next
    if (issuesByFramework.react) {
        const result = await applyReactFixes(sourceFile, componentContext, issuesByFramework.react);
        if (result) {
            operations.push({
                type: 'react_transformation',
                path: finalComponentPath,
                success: true,
                description: 'Applied React transformations',
            });
        }
    }
    // Process Next.js issues
    if (issuesByFramework.nextjs) {
        // Handle "use client" directive specially since it needs to be at the top
        const useClientIssues = issuesByFramework.nextjs.filter(issue => issue.code === 'NEXTJS_MISSING_USE_CLIENT' || issue.code === 'REACT19_MISSING_USE_CLIENT');
        if (useClientIssues.length > 0) {
            // Add use client directive at the very beginning of the file
            const fileContent = sourceFile.getFullText();
            if (!fileContent.includes('"use client"') && !fileContent.includes("'use client'")) {
                sourceFile.insertStatements(0, '"use client";');
                operations.push({
                    type: 'nextjs_transformation',
                    path: finalComponentPath,
                    success: true,
                    description: 'Added "use client" directive',
                });
            }
        }
        // Process other Next.js issues
        const otherNextJsIssues = issuesByFramework.nextjs.filter(issue => issue.code !== 'NEXTJS_MISSING_USE_CLIENT' && issue.code !== 'REACT19_MISSING_USE_CLIENT');
        if (otherNextJsIssues.length > 0) {
            const result = await applyNextJsFixes(sourceFile, componentContext, otherNextJsIssues);
            if (result) {
                operations.push({
                    type: 'nextjs_transformation',
                    path: finalComponentPath,
                    success: true,
                    description: 'Applied Next.js transformations',
                });
            }
        }
    }
    // Process Tailwind issues
    if (issuesByFramework.tailwind) {
        const result = await applyTailwindFixes(sourceFile, componentContext, issuesByFramework.tailwind);
        if (result) {
            operations.push({
                type: 'tailwind_transformation',
                path: finalComponentPath,
                success: true,
                description: 'Applied Tailwind transformations',
            });
        }
    }
    // Get the transformed content after all modifications
    const transformedContent = sourceFile.getFullText();
    // Validate the transformed content to make sure it's valid
    let validationIssues = [];
    try {
        const { validateTransformedCode } = require('./component-healing-validator');
        validationIssues = validateTransformedCode(sourceFile, transformedContent);
        if (validationIssues.length > 0) {
            console.warn(`⚠️ Validation found ${validationIssues.length} issues with the transformed code`);
            validationIssues.forEach(issue => {
                console.warn(`  - ${issue.type}: ${issue.message} at line ${issue.line}`);
            });
            // Only block critical errors, allow warnings
            const criticalIssues = validationIssues.filter(issue => issue.type === 'error');
            if (criticalIssues.length > 0) {
                operations.push({
                    type: 'validation_failed',
                    path: finalComponentPath,
                    success: false,
                    description: `Validation failed with ${criticalIssues.length} critical issues`,
                });
            }
        }
    }
    catch (error) {
        console.error(`Error validating transformed code: ${error}`);
    }
    // Ensure component follows file naming convention (kebab-case)
    const fileName = path.basename(finalComponentPath);
    if (!/^[a-z0-9-]+\.(tsx|jsx|js)$/.test(fileName)) {
        const parsedPath = path.parse(finalComponentPath);
        const kebabCaseName = toKebabCase(parsedPath.name);
        const newPath = path.join(parsedPath.dir, `${kebabCaseName}${parsedPath.ext}`);
        operations.push({
            type: 'rename_file',
            oldPath: finalComponentPath,
            newPath,
            success: true,
            description: `Renamed file to follow kebab-case convention: ${newPath}`,
        });
        finalComponentPath = newPath;
    }
    // Handle barrel exports
    const barrelIssues = await ensureBarrelExport(finalComponentPath, componentContext);
    if (barrelIssues && !options.dryRun) {
        operations.push({
            type: 'barrel_export',
            path: path.join(path.dirname(finalComponentPath), 'index.ts'),
            success: true,
            description: 'Updated barrel exports',
        });
    }
    // Write the transformed component if not in dry run mode
    if (!options.dryRun) {
        await (0, fs_1.writeFile)(finalComponentPath, transformedContent);
        // If this was a move or rename operation, remove the original file
        if (finalComponentPath !== componentPath) {
            await fs.promises.unlink(componentPath).catch(() => {
                // Ignore errors if the file doesn't exist
            });
        }
    }
    // Generate tests if requested
    if (options.generateTests) {
        const testResult = await (0, test_generation_engine_1.generateTestForComponent)(finalComponentPath, componentContext, options.dryRun);
        if (testResult.success) {
            operations.push({
                type: 'test_generation',
                path: testResult.testPath,
                success: true,
                description: `Generated test: ${testResult.testPath}`,
            });
        }
    }
    return {
        originalPath: componentPath,
        transformedPath: finalComponentPath,
        originalContent: content,
        transformedContent,
        operations,
        success: operations.length > 0,
    };
}
/**
 * Extracts component context from a source file
 */
function extractComponentContext(sourceFile, filePath) {
    var _a;
    const componentDeclarations = (0, ast_1.getComponentDeclarations)(sourceFile);
    const context = {
        filePath,
        content: sourceFile.getFullText(),
        isComponent: componentDeclarations.length > 0,
        usesTypeScript: filePath.endsWith('.tsx') || filePath.endsWith('.ts'),
        // Try to get the component name from the first component declaration
        componentName: ((_a = componentDeclarations[0]) === null || _a === void 0 ? void 0 : _a.getName()) || path.basename(filePath).split('.')[0],
        // Determine component type based on declaration
        isArrowFunction: componentDeclarations.some(c => {
            var _a;
            return ts_morph_1.Node.isVariableDeclaration(c) &&
                ((_a = c.getFirstAncestorByKind(ts_morph_1.SyntaxKind.VariableDeclarationList)) === null || _a === void 0 ? void 0 : _a.getKind()) === ts_morph_1.SyntaxKind.ConstKeyword;
        }),
        isFunctionDeclaration: componentDeclarations.some(c => ts_morph_1.Node.isMethodDeclaration(c) || ts_morph_1.Node.isFunctionDeclaration(c)),
        // Check for React FC usage
        usesReactFC: sourceFile.getFullText().includes('React.FC') ||
            sourceFile.getFullText().includes('React.FunctionComponent'),
        // Check for props interface
        hasPropInterface: sourceFile.getInterfaces().some(i => i.getName().endsWith('Props')),
        // Additional contextual information
        hasChildren: sourceFile.getFullText().includes('children'),
        isPage: filePath.includes('/pages/') || filePath.includes('/app/'),
        isServerComponent: !sourceFile.getFullText().includes('"use client"'),
    };
    return context;
}
// Group issues by framework for ordered processing
function groupIssuesByFramework(issues) {
    return issues.reduce((groups, issue) => {
        const framework = issue.framework || 'other';
        if (!groups[framework]) {
            groups[framework] = [];
        }
        groups[framework].push(issue);
        return groups;
    }, {});
}
// Apply TypeScript fixes to a component
async function applyTypeScriptFixes(sourceFile, componentContext, issues) {
    let hasChanges = false;
    // Apply each TypeScript fix in order
    for (const issue of issues) {
        // Skip issues without fix property
        if (!issue.fix)
            continue;
        // Destructure fix object for safer access
        const { type, pattern, patternOptions, replacement, line, content, transformer } = issue.fix;
        switch (type) {
            case 'replace':
                // Use ts-morph for more precise replacements
                (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                    const oldText = sf.getFullText();
                    // This is still string-based replacement but using the full source file
                    // A more robust solution would use ts-morph's manipulation APIs
                    // Ensure pattern and options are strings
                    const patternStr = typeof pattern === 'string' ? pattern : '';
                    const options = typeof patternOptions === 'string' ? patternOptions : undefined;
                    const replacementStr = typeof replacement === 'string' ? replacement : '';
                    const newText = oldText.replace(new RegExp(patternStr, options), replacementStr);
                    if (oldText !== newText) {
                        sf.replaceWithText(newText);
                        hasChanges = true;
                    }
                });
                break;
            case 'insert_line':
                // Insert content at specific line using ts-morph
                (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                    const lines = sf.getFullText().split('\n');
                    // Ensure line is a number and content is a string
                    const lineNum = typeof line === 'number' ? line : 1;
                    const contentStr = typeof content === 'string' ? content : '';
                    lines.splice(lineNum - 1, 0, contentStr);
                    sf.replaceWithText(lines.join('\n'));
                    hasChanges = true;
                });
                break;
            case 'complex':
                // Complex transformations like adding types
                if (transformer === 'addPropTypes') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = addPropTypesToComponent(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                else if (transformer === 'addReactFC') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = addReactFCToComponent(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                break;
        }
    }
    return hasChanges;
}
// Apply React fixes to a component
async function applyReactFixes(sourceFile, componentContext, issues) {
    let hasChanges = false;
    // Apply each React fix in order
    for (const issue of issues) {
        // Skip issues without fix property
        if (!issue.fix)
            continue;
        // Destructure fix object for safer access
        const { type, pattern, patternOptions, replacement, line, content, transformer } = issue.fix;
        switch (type) {
            case 'replace':
                // Use ts-morph for replacements
                (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                    const oldText = sf.getFullText();
                    // Ensure pattern and options are strings
                    const patternStr = typeof pattern === 'string' ? pattern : '';
                    const options = typeof patternOptions === 'string' ? patternOptions : undefined;
                    const replacementStr = typeof replacement === 'string' ? replacement : '';
                    // Special handling for useEffect dependency array to avoid syntax errors
                    if (patternStr.includes('useEffect') && issue.code === 'REACT19_INCOMPLETE_EFFECT_DEPS' && issue.fix) {
                        // Find all useEffect hooks using ts-morph instead of regex
                        const callExpressions = sf.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression);
                        for (const call of callExpressions) {
                            const expression = call.getExpression();
                            if (ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'useEffect') {
                                const args = call.getArguments();
                                if (args.length === 1) { // Only one argument - missing dependency array
                                    const callback = args[0];
                                    // Add the dependency array
                                    const dependencies = issue.fix.dependencies || [];
                                    const depArray = dependencies.length > 0 ?
                                        `[${dependencies.join(', ')}]` :
                                        '[]';
                                    // Use more precise ts-morph API to avoid syntax errors
                                    call.addArgument(depArray);
                                    hasChanges = true;
                                }
                            }
                        }
                    }
                    else {
                        // Regular pattern replacement for other cases
                        const newText = oldText.replace(new RegExp(patternStr, options), replacementStr);
                        if (oldText !== newText) {
                            sf.replaceWithText(newText);
                            hasChanges = true;
                        }
                    }
                });
                break;
            case 'insert_line':
                // Insert content at specific line
                (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                    const lines = sf.getFullText().split('\n');
                    // Ensure line is a number and content is a string
                    const lineNum = typeof line === 'number' ? line : 1;
                    const contentStr = typeof content === 'string' ? content : '';
                    lines.splice(lineNum - 1, 0, contentStr);
                    sf.replaceWithText(lines.join('\n'));
                    hasChanges = true;
                });
                break;
            case 'remove_line':
                // Remove specific line
                (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                    const lines = sf.getFullText().split('\n');
                    // Ensure line is a number
                    const lineNum = typeof line === 'number' ? line : 1;
                    lines.splice(lineNum - 1, 1);
                    sf.replaceWithText(lines.join('\n'));
                    hasChanges = true;
                });
                break;
            case 'complex':
                // Complex transformations for React
                if (transformer === 'transformToUseHook') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = transformToUseHook(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                else if (transformer === 'addUseClientDirective') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = addUseClientDirective(sf);
                        hasChanges = hasChanges || result;
                    });
                }
                else if (transformer === 'transformToNamedExport') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = transformToNamedExport(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                else if (transformer === 'transformToDestructuredProps') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = transformToDestructuredProps(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                break;
        }
    }
    return hasChanges;
}
// Apply Next.js fixes to a component
async function applyNextJsFixes(sourceFile, componentContext, issues) {
    let hasChanges = false;
    // Apply each Next.js fix in order
    for (const issue of issues) {
        // Skip issues without fix property
        if (!issue.fix)
            continue;
        // Destructure fix object for safer access
        const { type, pattern, patternOptions, replacement, transformer } = issue.fix;
        switch (type) {
            case 'replace':
                // Use ts-morph for replacements
                (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                    const oldText = sf.getFullText();
                    // Ensure pattern and options are strings
                    const patternStr = typeof pattern === 'string' ? pattern : '';
                    const options = typeof patternOptions === 'string' ? patternOptions : undefined;
                    const replacementStr = typeof replacement === 'string' ? replacement : '';
                    const newText = oldText.replace(new RegExp(patternStr, options), replacementStr);
                    if (oldText !== newText) {
                        sf.replaceWithText(newText);
                        hasChanges = true;
                    }
                });
                break;
            case 'complex':
                // Complex transformations for Next.js
                if (transformer === 'transformToAppRouter') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = transformToAppRouter(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                else if (transformer === 'replaceGetServerSideProps') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = replaceGetServerSideProps(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                break;
        }
    }
    return hasChanges;
}
// Apply Tailwind fixes to a component
async function applyTailwindFixes(sourceFile, componentContext, issues) {
    let hasChanges = false;
    // Apply each Tailwind fix in order
    for (const issue of issues) {
        // Skip issues without fix property
        if (!issue.fix)
            continue;
        // Destructure fix object for safer access
        const { type, pattern, patternOptions, replacement, transformer } = issue.fix;
        switch (type) {
            case 'replace':
                // Use ts-morph for replacements
                (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                    const oldText = sf.getFullText();
                    // Ensure pattern and options are strings
                    const patternStr = typeof pattern === 'string' ? pattern : '';
                    const options = typeof patternOptions === 'string' ? patternOptions : undefined;
                    const replacementStr = typeof replacement === 'string' ? replacement : '';
                    const newText = oldText.replace(new RegExp(patternStr, options), replacementStr);
                    if (oldText !== newText) {
                        sf.replaceWithText(newText);
                        hasChanges = true;
                    }
                });
                break;
            case 'complex':
                // Complex transformations for Tailwind
                if (transformer === 'transformToTailwindClasses') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = transformToTailwindClasses(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                else if (transformer === 'organizeClassNames') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = organizeClassNames(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                else if (transformer === 'addDarkModeVariants') {
                    (0, ast_1.transformSourceFile)(sourceFile, (sf) => {
                        const result = addDarkModeVariants(sf, componentContext);
                        hasChanges = hasChanges || result;
                    });
                }
                break;
        }
    }
    return hasChanges;
}
// Ensure component is exported from barrel file
async function ensureBarrelExport(componentPath, context) {
    const componentDir = path.dirname(componentPath);
    const componentName = context.componentName || '';
    const barrelPath = path.join(componentDir, 'index.ts');
    try {
        // Check if barrel file exists
        const barrelExists = await (0, fs_1.fileExists)(barrelPath);
        if (!barrelExists) {
            // Create barrel file
            await (0, fs_1.writeFile)(barrelPath, `/**
 * Barrel export file for components
 */

export * from './${path.basename(componentPath).split('.')[0]}';
`);
            return true;
        }
        else {
            // Read barrel file
            const barrelContent = await (0, fs_1.readFile)(barrelPath);
            // Check if component is already exported
            const exportPath = `./${path.basename(componentPath).split('.')[0]}`;
            if (!barrelContent.includes(exportPath)) {
                // Add export
                const newContent = barrelContent + `export * from '${exportPath}';\n`;
                await (0, fs_1.writeFile)(barrelPath, newContent);
                return true;
            }
        }
    }
    catch (error) {
        console.error('Error ensuring barrel export:', error);
    }
    return false;
}
// Add TypeScript prop interfaces to a component
function addPropTypesToComponent(sourceFile, context) {
    // Skip if already has prop interface
    if (context.hasPropInterface) {
        return false;
    }
    // Extract prop usage from the component using ts-morph
    const propNames = extractPropNames(sourceFile, context);
    if (propNames.length === 0) {
        return false;
    }
    // Build the interface definition
    const interfaceName = `${context.componentName}Props`;
    const interfaceDefinition = `
/**
 * Props for the ${context.componentName} component
 */
interface ${interfaceName} {
  ${propNames.map(prop => `/** ${toSentenceCase(prop)} */\n  ${prop}: any; // TODO: Replace with proper type`).join('\n  ')}
}
`.trim();
    // Find a good spot to insert the interface - after imports
    const lastImportDeclaration = sourceFile.getImportDeclarations()
        .sort((a, b) => b.getStartLineNumber() - a.getStartLineNumber())[0];
    if (lastImportDeclaration) {
        // Insert after the last import
        const pos = lastImportDeclaration.getEnd();
        sourceFile.insertText(pos, '\n\n' + interfaceDefinition + '\n');
        return true;
    }
    else {
        // If no imports, insert at the beginning
        sourceFile.insertText(0, interfaceDefinition + '\n\n');
        return true;
    }
}
// Add React.FC typing to a component
function addReactFCToComponent(sourceFile, context) {
    // Skip if already using React.FC
    if (context.usesReactFC) {
        return false;
    }
    const interfaceName = `${context.componentName}Props`;
    let hasChanges = false;
    // Handle arrow function components
    if (context.isArrowFunction) {
        // Find variable declarations for the component
        // Ensure componentName is defined before using it
        const componentName = context.componentName || '';
        const variableDeclaration = sourceFile.getVariableDeclaration(componentName);
        if (variableDeclaration) {
            const initializer = variableDeclaration.getInitializer();
            if (initializer && ts_morph_1.Node.isArrowFunction(initializer)) {
                // Get the type information for the variable declaration
                const variableDeclarationList = variableDeclaration.getFirstAncestorByKind(ts_morph_1.SyntaxKind.VariableDeclarationList);
                if (variableDeclarationList) {
                    // Get the variable statement that contains this declaration
                    const variableStatement = variableDeclarationList.getFirstAncestorByKind(ts_morph_1.SyntaxKind.VariableStatement);
                    if (variableStatement) {
                        const oldText = `const ${componentName} = `;
                        const newText = `const ${componentName}: React.FC<${interfaceName}> = `;
                        // Update the variable declaration
                        const fullText = sourceFile.getFullText();
                        const index = fullText.indexOf(oldText);
                        if (index !== -1) {
                            sourceFile.replaceText([index, index + oldText.length], newText);
                            hasChanges = true;
                        }
                    }
                }
            }
        }
    }
    // Handle function declarations
    else if (context.isFunctionDeclaration) {
        // Find function declarations for the component
        // Ensure componentName is defined before using it
        const componentName = context.componentName || '';
        const functionDeclaration = sourceFile.getFunction(componentName);
        if (functionDeclaration) {
            // Update the function's parameter type
            const parameters = functionDeclaration.getParameters();
            if (parameters.length > 0) {
                const firstParam = parameters[0];
                // If the parameter is named "props" and has no type, add the type
                if (firstParam.getName() === 'props' && !firstParam.getType()) {
                    firstParam.setType(interfaceName);
                    hasChanges = true;
                }
            }
            // For a proper FC declaration, we'd also need to add a return type
            // but this is more complex with ts-morph so we'll keep it simple for now
        }
    }
    // If we don't have React imported, add it
    if (hasChanges &&
        !sourceFile.getImportDeclarations().some(id => {
            var _a;
            return id.getModuleSpecifierValue() === 'react' &&
                ((_a = id.getNamespaceImport()) === null || _a === void 0 ? void 0 : _a.getText()) === 'React';
        })) {
        // Check if we have any react import at all
        const reactImport = sourceFile.getImportDeclarations()
            .find(id => id.getModuleSpecifierValue() === 'react');
        if (reactImport) {
            // If we have a named import from react, add React default import
            if (reactImport.getNamedImports().length > 0 && !reactImport.getDefaultImport()) {
                const oldImport = reactImport.getText();
                const newImport = oldImport.replace('import {', 'import React, {');
                sourceFile.replaceText([reactImport.getStart(), reactImport.getEnd()], newImport);
            }
        }
        else {
            // Add a new import for React
            sourceFile.insertText(0, `import React from 'react';\n`);
        }
    }
    return hasChanges;
}
// Transform promises to use the 'use' hook
function transformToUseHook(sourceFile, context) {
    var _a;
    let hasChanges = false;
    // Find useEffect hooks that have fetch calls
    const useEffectCalls = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression)
        .filter(call => {
        const expression = call.getExpression();
        return ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'useEffect';
    });
    for (const useEffectCall of useEffectCalls) {
        // Check if this useEffect contains a fetch call
        const fetchCalls = useEffectCall.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression)
            .filter(call => {
            const expression = call.getExpression();
            return ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'fetch';
        });
        if (fetchCalls.length > 0) {
            // This useEffect contains a fetch call
            const arrowFunction = useEffectCall.getArguments()[0];
            if (arrowFunction && ts_morph_1.Node.isArrowFunction(arrowFunction)) {
                const body = arrowFunction.getBody();
                // Extract the fetch call and transform it to use hook
                fetchCalls.forEach(fetchCall => {
                    var _a, _b;
                    const fetchStatementText = ((_a = fetchCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ExpressionStatement)) === null || _a === void 0 ? void 0 : _a.getText()) || '';
                    if (fetchStatementText.includes('.then')) {
                        // Extract the fetch URL
                        const fetchUrl = ((_b = fetchCall.getArguments()[0]) === null || _b === void 0 ? void 0 : _b.getText()) || '';
                        // Get the variable name being set in the then clause
                        const thenCall = fetchCall.getFirstDescendantByKind(ts_morph_1.SyntaxKind.PropertyAccessExpression);
                        const statementParent = fetchCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ExpressionStatement);
                        if (thenCall && statementParent) {
                            // Create use hook replacement
                            const useHookText = `// Changed from useEffect + fetch to React 19's 'use' hook\nconst data = use(fetch(${fetchUrl}).then(res => res.json()));`;
                            // Replace the fetch statement with the use hook
                            sourceFile.replaceText([statementParent.getStart(), statementParent.getEnd()], useHookText);
                            hasChanges = true;
                            // Also remove the dependency array and enclosing useEffect
                            const useEffectStatement = useEffectCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ExpressionStatement);
                            if (useEffectStatement) {
                                // Use the range variant of removeStatements
                                const index = useEffectStatement.getChildIndex();
                                sourceFile.removeStatements([index, index + 1]);
                            }
                        }
                    }
                });
            }
        }
    }
    // Find axios calls and transform them
    const axiosCalls = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression)
        .filter(call => {
        const expression = call.getExpression();
        if (ts_morph_1.Node.isPropertyAccessExpression(expression)) {
            const object = expression.getExpression();
            return ts_morph_1.Node.isIdentifier(object) && object.getText() === 'axios' &&
                (expression.getName() === 'get' || expression.getName() === 'post');
        }
        return false;
    });
    for (const axiosCall of axiosCalls) {
        if (axiosCall.getText().includes('.then')) {
            const statement = axiosCall.getFirstAncestorByKind(ts_morph_1.SyntaxKind.ExpressionStatement);
            if (statement) {
                // Extract the URL
                const url = ((_a = axiosCall.getArguments()[0]) === null || _a === void 0 ? void 0 : _a.getText()) || '';
                // Replace with use hook
                const useHookText = `const data = use(fetch(${url}).then(res => res.json()));`;
                sourceFile.replaceText([statement.getStart(), statement.getEnd()], useHookText);
                hasChanges = true;
            }
        }
    }
    // Add use to imports if needed
    if (hasChanges) {
        // Check if we already have a use import
        let hasUseImport = false;
        const reactImports = sourceFile.getImportDeclarations()
            .filter(imp => imp.getModuleSpecifierValue() === 'react');
        for (const reactImport of reactImports) {
            const namedImports = reactImport.getNamedImports();
            hasUseImport = namedImports.some(named => named.getName() === 'use');
            if (!hasUseImport) {
                // Add use to the import
                const namedImportsText = namedImports.map(n => n.getText()).join(', ');
                if (namedImportsText) {
                    const newNamedImports = `{ use, ${namedImportsText} }`;
                    reactImport.replaceWithText(reactImport.getText().replace(`{ ${namedImportsText} }`, newNamedImports));
                }
                else {
                    // No named imports yet, need to add them
                    if (reactImport.getDefaultImport()) {
                        // Has default import (React), add named import
                        reactImport.replaceWithText(reactImport.getText().replace('React', 'React, { use }'));
                    }
                    else {
                        // No React import at all
                        reactImport.replaceWithText(`import { use } from 'react';`);
                    }
                }
                hasUseImport = true;
                break;
            }
        }
        if (!hasUseImport && reactImports.length === 0) {
            // No React import at all, add one
            sourceFile.insertStatements(0, `import { use } from 'react';`);
        }
    }
    return hasChanges;
}
// Add "use client" directive to a component
function addUseClientDirective(sourceFile) {
    // Skip if already has directive
    if (sourceFile.getFullText().includes('"use client"') ||
        sourceFile.getFullText().includes("'use client'")) {
        return false;
    }
    // Add directive at the top
    sourceFile.insertStatements(0, '"use client";\n');
    return true;
}
// Transform default export to named export
function transformToNamedExport(sourceFile, context) {
    let hasChanges = false;
    // A simple direct approach to get this working properly
    try {
        // Get the content of the file
        const fullText = sourceFile.getFullText();
        // Find the component name from the default export
        const exportDefaultMatch = fullText.match(/export\s+default\s+(\w+)/);
        if (exportDefaultMatch && exportDefaultMatch[1]) {
            const componentName = exportDefaultMatch[1];
            // Find the function declaration
            const functionMatch = fullText.match(new RegExp(`function\\s+${componentName}\\s*\\(`));
            if (functionMatch) {
                // Create new content with export keyword and without default export
                let newContent = fullText.replace(/export\s+default\s+\w+\s*;?/, '');
                newContent = newContent.replace(new RegExp(`function\\s+${componentName}\\s*\\(`), `export function ${componentName}(`);
                // Apply the changes directly
                sourceFile.replaceWithText(newContent);
                hasChanges = true;
                return hasChanges;
            }
            // If it's not a function declaration, check for variable declaration
            const varMatch = fullText.match(new RegExp(`(const|let|var)\\s+${componentName}\\s*=`));
            if (varMatch) {
                // Create new content with export keyword and without default export
                let newContent = fullText.replace(/export\s+default\s+\w+\s*;?/, '');
                newContent = newContent.replace(new RegExp(`(const|let|var)\\s+${componentName}\\s*=`), `export $1 ${componentName} =`);
                // Apply the changes directly
                sourceFile.replaceWithText(newContent);
                hasChanges = true;
                return hasChanges;
            }
        }
        // More complex approach as backup
        // Check for default export assignment
        const exportAssignments = sourceFile.getExportAssignments();
        for (const exportAssignment of exportAssignments) {
            if (!exportAssignment.isExportEquals()) {
                const expression = exportAssignment.getExpression();
                // Check if it's exporting a component
                if (ts_morph_1.Node.isIdentifier(expression)) {
                    const componentName = expression.getText();
                    // Find the position of the export to remove it
                    const exportPos = exportAssignment.getPos();
                    const exportEnd = exportAssignment.getEnd();
                    // Remove the export default statement
                    sourceFile.replaceText([exportPos, exportEnd], '');
                    // Find the function declaration
                    const functionDeclaration = sourceFile.getFunction(componentName);
                    if (functionDeclaration) {
                        // Get the function text
                        const funcText = functionDeclaration.getText();
                        // Create a new function text with export
                        const newFuncText = `export ${funcText}`;
                        // Replace the function text
                        sourceFile.replaceText([functionDeclaration.getPos(), functionDeclaration.getEnd()], newFuncText);
                        hasChanges = true;
                        return hasChanges;
                    }
                    // Find the variable declaration as a backup
                    const varDeclaration = sourceFile.getVariableDeclaration(componentName);
                    if (varDeclaration) {
                        const varStatement = varDeclaration.getFirstAncestorByKind(ts_morph_1.SyntaxKind.VariableStatement);
                        if (varStatement) {
                            // Get the variable statement text
                            const varText = varStatement.getText();
                            // Create a new variable statement text with export
                            const newVarText = `export ${varText}`;
                            // Replace the variable statement text
                            sourceFile.replaceText([varStatement.getPos(), varStatement.getEnd()], newVarText);
                            hasChanges = true;
                            return hasChanges;
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        console.error('Error in transformToNamedExport:', error);
        // Last-resort fallback using direct text manipulation
        try {
            const fullText = sourceFile.getFullText();
            // Simple pattern replacement as a last resort
            const defaultExportPattern = /export\s+default\s+(\w+)\s*;?/;
            const match = fullText.match(defaultExportPattern);
            if (match && match[1]) {
                const componentName = match[1];
                // Remove default export
                let newText = fullText.replace(defaultExportPattern, '');
                // Add export to function or variable declaration
                const functionPattern = new RegExp(`function\\s+${componentName}\\s*\\(`);
                if (functionPattern.test(newText)) {
                    newText = newText.replace(functionPattern, `export function ${componentName}(`);
                    sourceFile.replaceWithText(newText);
                    hasChanges = true;
                }
                else {
                    // Try variable pattern
                    const varPattern = new RegExp(`(const|let|var)\\s+${componentName}\\s*=`);
                    const varMatch = newText.match(varPattern);
                    if (varMatch) {
                        newText = newText.replace(varPattern, `export ${varMatch[1]} ${componentName} =`);
                        sourceFile.replaceWithText(newText);
                        hasChanges = true;
                    }
                }
            }
        }
        catch (fallbackError) {
            console.error('Fallback export transformation failed:', fallbackError);
        }
    }
    return hasChanges;
}
// Transform to use destructured props
function transformToDestructuredProps(sourceFile, context) {
    // Extract prop names using ts-morph
    const propNames = extractPropNames(sourceFile, context);
    if (propNames.length === 0) {
        return false;
    }
    let hasChanges = false;
    // Apply different strategies based on component style
    if (context.isArrowFunction) {
        // Arrow function component
        // Ensure componentName is defined before using it
        const componentName = context.componentName || '';
        const variableDeclaration = sourceFile.getVariableDeclaration(componentName);
        if (variableDeclaration) {
            const initializer = variableDeclaration.getInitializer();
            if (initializer && ts_morph_1.Node.isArrowFunction(initializer)) {
                const parameters = initializer.getParameters();
                if (parameters.length === 1 && parameters[0].getName() === 'props') {
                    // Replace props parameter with destructured version
                    const newParam = `{ ${propNames.join(', ')} }`;
                    parameters[0].replaceWithText(newParam);
                    hasChanges = true;
                }
            }
        }
    }
    else if (context.isFunctionDeclaration) {
        // Function declaration component
        // Ensure componentName is defined before using it
        const componentName = context.componentName || '';
        const functionDeclaration = sourceFile.getFunction(componentName);
        if (functionDeclaration) {
            const parameters = functionDeclaration.getParameters();
            if (parameters.length === 1 && parameters[0].getName() === 'props') {
                // Replace props parameter with destructured version
                const newParam = `{ ${propNames.join(', ')} }`;
                parameters[0].replaceWithText(newParam);
                hasChanges = true;
            }
        }
    }
    // If we've changed the parameters, also update props.X references
    if (hasChanges) {
        // Find property access expressions like props.X
        const propertyAccesses = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.PropertyAccessExpression);
        for (const propAccess of propertyAccesses) {
            const expression = propAccess.getExpression();
            if (ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'props') {
                const propName = propAccess.getName();
                // Replace props.X with just X
                sourceFile.replaceText([propAccess.getStart(), propAccess.getEnd()], propName);
            }
        }
    }
    return hasChanges;
}
// Transform component to App Router pattern
function transformToAppRouter(sourceFile, context) {
    let hasChanges = false;
    // Remove getStaticProps or getServerSideProps functions
    const exportedFunctions = sourceFile.getFunctions().filter(func => func.isExported() &&
        (func.getName() === 'getStaticProps' || func.getName() === 'getServerSideProps'));
    for (const func of exportedFunctions) {
        const index = func.getChildIndex();
        sourceFile.removeStatements([index, index + 1]);
        hasChanges = true;
    }
    // Add 'use client' if using client-side features
    if (sourceFile.getFullText().includes('useState') ||
        sourceFile.getFullText().includes('useEffect') ||
        sourceFile.getFullText().includes('onClick')) {
        if (!sourceFile.getFullText().includes('"use client"') &&
            !sourceFile.getFullText().includes("'use client'")) {
            sourceFile.insertStatements(0, '"use client";\n');
            hasChanges = true;
        }
    }
    return hasChanges;
}
// Replace getServerSideProps with direct data fetching
function replaceGetServerSideProps(sourceFile, context) {
    var _a;
    let hasChanges = false;
    // Find getServerSideProps function
    const gsspFunction = sourceFile.getFunctions().find(func => func.getName() === 'getServerSideProps');
    if (!gsspFunction) {
        return false;
    }
    // Look for fetch calls within getServerSideProps
    const fetchCalls = gsspFunction.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression)
        .filter(call => {
        const expression = call.getExpression();
        return ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'fetch';
    });
    if (fetchCalls.length > 0) {
        // Extract fetch URL from the first fetch call
        const fetchUrl = ((_a = fetchCalls[0].getArguments()[0]) === null || _a === void 0 ? void 0 : _a.getText()) || '';
        // Add direct fetch to the component
        // Ensure componentName is defined before using it
        const componentName = context.componentName || '';
        const componentDeclaration = sourceFile.getFunction(componentName) ||
            sourceFile.getVariableDeclaration(componentName);
        if (componentDeclaration) {
            // For function declarations
            if (ts_morph_1.Node.isFunctionDeclaration(componentDeclaration)) {
                const body = componentDeclaration.getBody();
                if (body && ts_morph_1.Node.isBlock(body)) {
                    // Insert at the beginning of the function body
                    const statements = body.getStatements();
                    if (statements.length > 0) {
                        const firstStatement = statements[0];
                        body.insertStatements(0, `  // Direct fetch using App Router pattern\n  const data = use(fetch(${fetchUrl}).then(res => res.json()));\n`);
                    }
                    else {
                        // If no statements, replace the body entirely
                        body.replaceWithText(`{\n  // Direct fetch using App Router pattern\n  const data = use(fetch(${fetchUrl}).then(res => res.json()));\n}`);
                    }
                    hasChanges = true;
                }
            }
            // For arrow functions
            else if (ts_morph_1.Node.isVariableDeclaration(componentDeclaration)) {
                const initializer = componentDeclaration.getInitializer();
                if (initializer && ts_morph_1.Node.isArrowFunction(initializer)) {
                    const body = initializer.getBody();
                    if (ts_morph_1.Node.isBlock(body)) {
                        // Insert at the beginning of the arrow function body
                        const statements = body.getStatements();
                        if (statements.length > 0) {
                            body.insertStatements(0, `  // Direct fetch using App Router pattern\n  const data = use(fetch(${fetchUrl}).then(res => res.json()));\n`);
                        }
                        else {
                            // If no statements, replace the body entirely
                            body.replaceWithText(`{\n  // Direct fetch using App Router pattern\n  const data = use(fetch(${fetchUrl}).then(res => res.json()));\n}`);
                        }
                        hasChanges = true;
                    }
                }
            }
            // Add use import
            if (hasChanges) {
                // Check if we already have a use import
                let hasUseImport = false;
                const reactImports = sourceFile.getImportDeclarations()
                    .filter(imp => imp.getModuleSpecifierValue() === 'react');
                for (const reactImport of reactImports) {
                    const namedImports = reactImport.getNamedImports();
                    hasUseImport = namedImports.some(named => named.getName() === 'use');
                    if (!hasUseImport) {
                        // Add use to the import
                        const namedImportsText = namedImports.map(n => n.getText()).join(', ');
                        if (namedImportsText) {
                            const newNamedImports = `{ use, ${namedImportsText} }`;
                            reactImport.replaceWithText(reactImport.getText().replace(`{ ${namedImportsText} }`, newNamedImports));
                        }
                        else {
                            // No named imports yet, need to add them
                            if (reactImport.getDefaultImport()) {
                                // Has default import (React), add named import
                                reactImport.replaceWithText(reactImport.getText().replace('React', 'React, { use }'));
                            }
                            else {
                                // No React import at all
                                reactImport.replaceWithText(`import { use } from 'react';`);
                            }
                        }
                        hasUseImport = true;
                        break;
                    }
                }
                if (!hasUseImport && reactImports.length === 0) {
                    // No React import at all, add one
                    sourceFile.insertStatements(0, `import { use } from 'react';`);
                }
            }
        }
        // Remove getServerSideProps function
        const index = gsspFunction.getChildIndex();
        sourceFile.removeStatements([index, index + 1]);
        hasChanges = true;
    }
    return hasChanges;
}
// Transform inline styles to Tailwind classes
function transformToTailwindClasses(sourceFile, context) {
    // This is a simplistic implementation - in a real version we'd use ts-morph to find
    // style attributes and transform them more precisely
    let oldText = sourceFile.getFullText();
    let newText = oldText
        // Replace some common inline styles with Tailwind equivalents
        .replace(/style={{(\s*?)margin:(\s*?)['"](\d+)px['"]/g, 'className="m-$3"')
        .replace(/style={{(\s*?)padding:(\s*?)['"](\d+)px['"]/g, 'className="p-$3"')
        .replace(/style={{(\s*?)fontSize:(\s*?)['"](\d+)px['"]/g, 'className="text-$3"')
        .replace(/style={{(\s*?)fontWeight:(\s*?)['"]bold['"]/g, 'className="font-bold"')
        .replace(/style={{(\s*?)display:(\s*?)['"]flex['"]/g, 'className="flex"')
        .replace(/style={{(\s*?)flexDirection:(\s*?)['"]column['"]/g, 'className="flex flex-col"')
        .replace(/style={{(\s*?)alignItems:(\s*?)['"]center['"]/g, 'className="items-center"')
        .replace(/style={{(\s*?)justifyContent:(\s*?)['"]center['"]/g, 'className="justify-center"');
    if (newText !== oldText) {
        sourceFile.replaceWithText(newText);
        return true;
    }
    return false;
}
// Organize Tailwind class names for readability
function organizeClassNames(sourceFile, context) {
    let hasChanges = false;
    // Find all JSX attributes with className
    const jsxAttributes = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxAttribute)
        .filter(attr => {
        // For ts-morph JsxAttribute, we need to check the name as a node
        const nameNode = attr.getNameNode();
        return nameNode && nameNode.getText() === 'className';
    });
    for (const attr of jsxAttributes) {
        const initializer = attr.getInitializer();
        if (initializer && ts_morph_1.Node.isStringLiteral(initializer)) {
            const classNames = initializer.getLiteralText();
            // Only process long class lists (more than 50 chars)
            if (classNames.length > 50 && !attr.getText().includes('cn(')) {
                // Split classes into categories
                const classes = classNames.split(/\s+/);
                // Group classes by category (simplified version)
                const layoutClasses = classes.filter(c => c.match(/^(flex|grid|block|inline|hidden|overflow|position|inset|top|right|bottom|left|z|float|clear)/));
                const spacingClasses = classes.filter(c => c.match(/^(p|m|space|gap)/));
                const typographyClasses = classes.filter(c => c.match(/^(text|font|tracking|leading|list|whitespace|break|hyphens)/));
                const visualClasses = classes.filter(c => c.match(/^(bg|text-[a-z]|border|rounded|shadow|opacity|ring|outline|fill|stroke)/));
                const interactionClasses = classes.filter(c => c.match(/^(hover|focus|active|disabled|group|peer|visited|focus-within|focus-visible)/));
                const otherClasses = classes.filter(c => !layoutClasses.includes(c) &&
                    !spacingClasses.includes(c) &&
                    !typographyClasses.includes(c) &&
                    !visualClasses.includes(c) &&
                    !interactionClasses.includes(c));
                // Format into multiple lines for readability
                const suggestion = '// Consider using cn() utility: import { cn } from "@/utils/cn";';
                const formattedClasses = `{
  "${layoutClasses.join(' ')} ${spacingClasses.join(' ')}"
  + " ${typographyClasses.join(' ')}"
  + " ${visualClasses.join(' ')}"
  + " ${interactionClasses.join(' ')} ${otherClasses.join(' ')}"
}`;
                // Replace the original attribute
                const parent = attr.getParent();
                if (parent) {
                    const parentText = parent.getText();
                    const attrText = attr.getText();
                    const attrIndex = parentText.indexOf(attrText);
                    if (attrIndex !== -1) {
                        const beforeAttr = parentText.slice(0, attrIndex);
                        const afterAttr = parentText.slice(attrIndex + attrText.length);
                        const newText = `${beforeAttr}${suggestion}\nclassName=${formattedClasses}${afterAttr}`;
                        parent.replaceWithText(newText);
                        hasChanges = true;
                    }
                }
            }
        }
    }
    return hasChanges;
}
// Add dark mode variants to Tailwind classes
function addDarkModeVariants(sourceFile, context) {
    let hasChanges = false;
    // Find all JSX attributes with className that contain color classes
    const jsxAttributes = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.JsxAttribute)
        .filter(attr => {
        // For ts-morph JsxAttribute, we need to check the name as a node
        const nameNode = attr.getNameNode();
        const isClassName = nameNode && nameNode.getText() === 'className';
        // Check if the attribute text contains color classes
        const hasColorClasses = attr.getText().match(/(bg|text|border)-(white|black|gray|slate|blue|red|green|yellow|purple|pink|indigo)/);
        return isClassName && hasColorClasses;
    });
    for (const attr of jsxAttributes) {
        const initializer = attr.getInitializer();
        if (initializer && ts_morph_1.Node.isStringLiteral(initializer)) {
            const classNames = initializer.getLiteralText();
            // Skip if already has dark mode variant
            if (classNames.includes('dark:')) {
                continue;
            }
            // Find color classes using regex
            const colorClassesRegex = new RegExp(/(bg|text|border)-(white|black|gray|slate|blue|red|green|yellow|purple|pink|indigo)(-\d+)?/g);
            const colorClassMatches = [];
            // Use exec in a loop instead of matchAll for better compatibility
            let match;
            while ((match = colorClassesRegex.exec(classNames)) !== null) {
                colorClassMatches.push(match);
            }
            if (colorClassMatches.length > 0) {
                let newClassNames = classNames;
                // Add dark variant for each color class
                for (const match of colorClassMatches) {
                    const [fullMatch, type, color, shade = ''] = match;
                    // Determine contrasting dark mode color
                    let darkColor = color;
                    let darkShade = '900';
                    if (color === 'white') {
                        darkColor = 'gray';
                        darkShade = '900';
                    }
                    else if (color === 'black') {
                        darkColor = 'gray';
                        darkShade = '100';
                    }
                    else if (shade) {
                        // Invert the shade number
                        const shadeNum = parseInt(shade.substring(1));
                        if (shadeNum <= 400) {
                            darkShade = '900';
                        }
                        else if (shadeNum >= 500) {
                            darkShade = '100';
                        }
                    }
                    // Add dark variant
                    const darkVariant = `dark:${type}-${darkColor}-${darkShade}`;
                    newClassNames = newClassNames.replace(fullMatch, `${fullMatch} ${darkVariant}`);
                }
                if (newClassNames !== classNames) {
                    // Replace the class name
                    initializer.replaceWithText(`"${newClassNames}"`);
                    hasChanges = true;
                }
            }
        }
    }
    return hasChanges;
}
// Helper functions for component transformation
// Extract props from component using ts-morph
function extractPropNames(sourceFile, context) {
    const propNames = new Set();
    // Find property access expressions like props.X
    const propertyAccesses = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.PropertyAccessExpression);
    for (const propAccess of propertyAccesses) {
        const expression = propAccess.getExpression();
        if (ts_morph_1.Node.isIdentifier(expression) && expression.getText() === 'props') {
            propNames.add(propAccess.getName());
        }
    }
    // Look for destructured props in parameters
    const arrowFunctions = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.ArrowFunction);
    for (const arrowFunc of arrowFunctions) {
        const parameters = arrowFunc.getParameters();
        for (const param of parameters) {
            if (ts_morph_1.Node.isParameterDeclaration(param) && param.isParameterProperty()) {
                const bindingPattern = param.getFirstDescendantByKind(ts_morph_1.SyntaxKind.ObjectBindingPattern);
                if (bindingPattern) {
                    const elements = bindingPattern.getElements();
                    for (const element of elements) {
                        propNames.add(element.getName());
                    }
                }
            }
        }
    }
    // Check function declarations similarly
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
        if (func.getName() === context.componentName) {
            const parameters = func.getParameters();
            for (const param of parameters) {
                if (param.isParameterProperty()) {
                    const bindingPattern = param.getFirstDescendantByKind(ts_morph_1.SyntaxKind.ObjectBindingPattern);
                    if (bindingPattern) {
                        const elements = bindingPattern.getElements();
                        for (const element of elements) {
                            propNames.add(element.getName());
                        }
                    }
                }
            }
        }
    }
    return Array.from(propNames);
}
// Helper to convert string to kebab-case
function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
}
// Helper to convert string to PascalCase
function toPascalCase(str) {
    return str
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
// Helper to convert string to Sentence Case
function toSentenceCase(str) {
    return str.charAt(0).toUpperCase() +
        str.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase();
}
