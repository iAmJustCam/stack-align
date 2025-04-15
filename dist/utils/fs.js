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
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.fileExists = fileExists;
exports.ensureDirectoryExists = ensureDirectoryExists;
exports.getRelativePath = getRelativePath;
exports.cleanDirectories = cleanDirectories;
exports.createDirectory = createDirectory;
exports.directoryExists = directoryExists;
exports.getFilesWithExtension = getFilesWithExtension;
exports.readJsonFile = readJsonFile;
exports.readAlignIgnoreFile = readAlignIgnoreFile;
exports.shouldIgnoreFile = shouldIgnoreFile;
exports.parseFile = parseFile;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const minimatch_1 = __importDefault(require("minimatch"));
// No longer using chalk for console coloring
/**
 * Reads a file from the given path
 */
async function readFile(filePath) {
    try {
        return await fs_1.promises.readFile(filePath, 'utf8');
    }
    catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}
/**
 * Writes content to a file
 */
async function writeFile(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        await fs_1.promises.mkdir(dir, { recursive: true });
        await fs_1.promises.writeFile(filePath, content, 'utf8');
    }
    catch (error) {
        console.error(`Error writing to file ${filePath}:`, error);
        throw error;
    }
}
/**
 * Checks if a file exists
 */
async function fileExists(filePath) {
    try {
        await fs_1.promises.access(filePath);
        return true;
    }
    catch (_a) {
        return false;
    }
}
/**
 * Ensures a directory exists, creating it if necessary
 */
async function ensureDirectoryExists(dirPath) {
    try {
        await fs_1.promises.mkdir(dirPath, { recursive: true });
    }
    catch (error) {
        console.error(`Error creating directory ${dirPath}:`, error);
        throw error;
    }
}
/**
 * Gets relative path between two absolute paths
 */
function getRelativePath(from, to) {
    return path.relative(path.dirname(from), to).replace(/\\/g, '/');
}
/**
 * Clean directories using native fs.rm
 *
 * @param paths - Single path or array of paths to clean
 * @param options - Optional configuration
 * @returns Promise resolving when all paths are cleaned
 */
async function cleanDirectories(paths, options = {}) {
    const pathsToClean = Array.isArray(paths) ? paths : [paths];
    const { verbose = false, force = true } = options;
    if (verbose) {
        console.log('Cleaning directories:');
        pathsToClean.forEach(p => console.log(`  - ${p}`));
    }
    await Promise.all(pathsToClean.map(async (dirPath) => {
        try {
            await fs_1.promises.rm(dirPath, { recursive: true, force });
            if (verbose) {
                console.log(`✓ Cleaned ${dirPath}`);
            }
        }
        catch (error) {
            // Handle common errors
            if (error instanceof Error &&
                'code' in error &&
                error.code === 'ENOENT') {
                // Directory doesn't exist, which is fine for a clean operation
                if (verbose) {
                    console.log(`! ${dirPath} already clean (doesn't exist)`);
                }
                return;
            }
            // Re-throw unexpected errors
            throw error;
        }
    }));
}
/**
 * Creates a directory if it doesn't exist
 *
 * @param dirPath - Directory path to create
 */
async function createDirectory(dirPath) {
    await fs_1.promises.mkdir(dirPath, { recursive: true });
}
/**
 * Checks if a directory exists
 *
 * @param dirPath - Directory path to check
 * @returns True if the directory exists
 */
async function directoryExists(dirPath) {
    try {
        const stats = await fs_1.promises.stat(dirPath);
        return stats.isDirectory();
    }
    catch (_a) {
        return false;
    }
}
/**
 * Gets a list of files with specific extensions in a directory
 *
 * @param dirPath - Directory path to search
 * @param extensions - Array of file extensions to match (e.g., ['.ts', '.tsx'])
 * @param recursive - Whether to search recursively
 * @returns Array of matching file paths
 */
async function getFilesWithExtension(dirPath, extensions, recursive = false) {
    const files = [];
    async function processDirectory(currentPath) {
        const entries = await fs_1.promises.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);
            if (entry.isDirectory() && recursive) {
                await processDirectory(entryPath);
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (extensions.includes(ext)) {
                    files.push(entryPath);
                }
            }
        }
    }
    await processDirectory(dirPath);
    return files;
}
/**
 * Reads a JSON file and parses it
 *
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON content
 */
async function readJsonFile(filePath) {
    const content = await readFile(filePath);
    return JSON.parse(content);
}
/**
 * Reads and parses an .alignignore file
 *
 * @param rootDir - Root directory where .alignignore is located
 * @returns Array of glob patterns to ignore
 */
async function readAlignIgnoreFile(rootDir) {
    const ignoreFilePath = path.join(rootDir, '.alignignore');
    try {
        // Check if .alignignore file exists
        if (await fileExists(ignoreFilePath)) {
            const content = await readFile(ignoreFilePath);
            // Parse lines, removing comments and empty lines
            return content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
        }
    }
    catch (error) {
        console.warn(`Warning: Error reading .alignignore file: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Return empty array if file doesn't exist or there was an error
    return [];
}
/**
 * Checks if a file should be ignored based on .alignignore patterns
 *
 * @param filePath - Path of the file to check
 * @param rootDir - Root directory of the project
 * @param ignorePatterns - Patterns to ignore (from .alignignore)
 * @returns True if the file should be ignored, false otherwise
 */
function shouldIgnoreFile(filePath, rootDir, ignorePatterns) {
    if (ignorePatterns.length === 0) {
        return false; // No ignore patterns
    }
    // Get the relative path from the root dir
    const relativePath = path.relative(rootDir, filePath);
    // Check if any pattern matches
    return ignorePatterns.some(pattern => {
        const matcher = new minimatch_1.default.Minimatch(pattern, { dot: true, matchBase: true });
        return matcher.match(relativePath);
    });
}
/**
 * Parse file and extract basic information
 *
 * @param filePath Path to the file to parse
 * @returns Basic information about the file structure
 */
async function parseFile(filePath) {
    const content = await readFile(filePath);
    // Perform a simple parsing using regex for common patterns
    // Note: This is not as robust as ts-morph but can be used for simpler files
    // Extract imports
    const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+))\s+from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const namedImportsText = match[1];
        const namespaceImport = match[2];
        const defaultImport = match[3];
        const importPath = match[4];
        const names = [];
        if (defaultImport) {
            names.push(defaultImport);
        }
        if (namedImportsText) {
            const namedImports = namedImportsText.split(',').map(s => s.trim());
            names.push(...namedImports);
        }
        if (namespaceImport) {
            names.push(namespaceImport);
        }
        imports.push({ source: importPath, names });
    }
    // Extract exports
    const exportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+([a-zA-Z0-9_]+)/g;
    const exports = [];
    while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
    }
    // Extract function calls
    const functionCallRegex = /([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g;
    const functionCalls = [];
    while ((match = functionCallRegex.exec(content)) !== null) {
        const name = match[1];
        const argsText = match[2];
        const args = argsText.split(',').map(arg => arg.trim()).filter(arg => arg !== '');
        functionCalls.push({ name, args });
    }
    // Add includes method to check for text in the content
    const includes = (text) => content.includes(text);
    // Create a content object that also has an includes method
    const contentWithIncludes = Object.assign(content, { includes });
    return {
        filePath,
        content: contentWithIncludes,
        imports,
        exports,
        functionCalls,
        includes,
    };
}
