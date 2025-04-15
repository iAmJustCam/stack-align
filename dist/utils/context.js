"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectContext = createProjectContext;
exports.getRelativePathFromRoot = getRelativePathFromRoot;
exports.getAbsolutePathFromRoot = getAbsolutePathFromRoot;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ast_1 = require("./ast");
/**
 * Creates a project context from a root directory
 */
function createProjectContext(rootDir) {
    const context = {
        rootDir,
        project: (0, ast_1.createProject)(),
        projectName: path_1.default.basename(rootDir),
    };
    // Try to load tsconfig.json
    const tsconfigPath = path_1.default.join(rootDir, 'tsconfig.json');
    if (fs_1.default.existsSync(tsconfigPath)) {
        try {
            const tsconfigContent = JSON.parse(fs_1.default.readFileSync(tsconfigPath, 'utf8'));
            context.tsconfig = {
                path: tsconfigPath,
                content: tsconfigContent,
            };
        }
        catch (error) {
            console.warn(`Error parsing tsconfig.json:`, error);
        }
    }
    // Try to load package.json
    const packageJsonPath = path_1.default.join(rootDir, 'package.json');
    if (fs_1.default.existsSync(packageJsonPath)) {
        try {
            const packageJsonContent = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf8'));
            context.packageJson = {
                path: packageJsonPath,
                content: packageJsonContent,
            };
        }
        catch (error) {
            console.warn(`Error parsing package.json:`, error);
        }
    }
    // Try to load stack-align.config.js
    const stackAlignConfigPath = path_1.default.join(rootDir, 'stack-align.config.js');
    if (fs_1.default.existsSync(stackAlignConfigPath)) {
        try {
            // We won't actually require() the file here to avoid executing it
            // Just record that it exists for now
            context.stackAlignConfig = {
                path: stackAlignConfigPath,
                content: {}, // Would be populated when needed
            };
        }
        catch (error) {
            console.warn(`Error parsing stack-align.config.js:`, error);
        }
    }
    return context;
}
/**
 * Gets the relative path from the project root
 */
function getRelativePathFromRoot(context, absolutePath) {
    return path_1.default.relative(context.rootDir, absolutePath);
}
/**
 * Gets the absolute path from a path relative to the project root
 */
function getAbsolutePathFromRoot(context, relativePath) {
    return path_1.default.resolve(context.rootDir, relativePath);
}
