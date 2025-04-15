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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanProject = scanProject;
const path_1 = __importDefault(require("path"));
const globModule = __importStar(require("glob"));
const ast_1 = require("./ast");
const fs_1 = require("./fs");
/**
 * Scans a project for files
 */
async function scanProject(context) {
    const { rootDir } = context;
    // Read .alignignore file if it exists
    const ignorePatterns = await (0, fs_1.readAlignIgnoreFile)(rootDir);
    // Combine default ignore patterns with ones from .alignignore
    const defaultIgnorePatterns = ['**/node_modules/**', '**/.next/**', '**/dist/**'];
    const allIgnorePatterns = [...defaultIgnorePatterns, ...ignorePatterns];
    if (ignorePatterns.length > 0) {
        console.log(`Using .alignignore with ${ignorePatterns.length} patterns`);
    }
    // Get all TypeScript and TSX files (excluding ignored paths)
    const allFiles = await findFiles(rootDir, ['**/*.ts', '**/*.tsx'], allIgnorePatterns);
    // Filter files by types
    const componentFiles = allFiles.filter(file => {
        return (file.endsWith('.tsx') &&
            !file.includes('__tests__') &&
            !file.includes('.test.') &&
            !file.includes('.spec.') &&
            !file.includes('/pages/') && // Next.js pages aren't necessarily components
            !path_1.default.basename(file).startsWith('_'));
    });
    const hookFiles = allFiles.filter(file => {
        const fileName = path_1.default.basename(file);
        return fileName.startsWith('use') && fileName.endsWith('.ts');
    });
    const testFiles = allFiles.filter(file => {
        return file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.');
    });
    const typeFiles = allFiles.filter(file => {
        const fileName = path_1.default.basename(file);
        return (fileName.includes('.d.ts') ||
            fileName.includes('types.ts') ||
            file.includes('/types/') ||
            file.includes('/interfaces/'));
    });
    const utilFiles = allFiles.filter(file => {
        return (file.includes('/utils/') ||
            file.includes('/helpers/') ||
            file.includes('/lib/'));
    });
    // Add relevant files to the ts-morph project
    for (const file of allFiles) {
        (0, ast_1.addSourceFile)(context.project, file);
    }
    return {
        componentFiles,
        hookFiles,
        testFiles,
        typeFiles,
        utilFiles,
        allFiles,
    };
}
/**
 * Finds files in a directory matching the given patterns
 */
async function findFiles(rootDir, patterns, ignore = []) {
    const options = {
        cwd: rootDir,
        ignore,
        absolute: true,
        nodir: true,
    };
    const results = [];
    for (const pattern of patterns) {
        const files = await new Promise((resolve, reject) => {
            // Use the glob API compatible with version 11
            (async () => {
                try {
                    const matches = await globModule.glob(pattern, options);
                    resolve(matches);
                }
                catch (err) {
                    reject(err);
                }
            })();
        });
        results.push(...files);
    }
    // Return unique files
    return [...new Set(results)];
}
