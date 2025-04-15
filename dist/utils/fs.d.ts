/**
 * Reads a file from the given path
 */
export declare function readFile(filePath: string): Promise<string>;
/**
 * Writes content to a file
 */
export declare function writeFile(filePath: string, content: string): Promise<void>;
/**
 * Checks if a file exists
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Ensures a directory exists, creating it if necessary
 */
export declare function ensureDirectoryExists(dirPath: string): Promise<void>;
/**
 * Gets relative path between two absolute paths
 */
export declare function getRelativePath(from: string, to: string): string;
/**
 * Clean directories using native fs.rm
 *
 * @param paths - Single path or array of paths to clean
 * @param options - Optional configuration
 * @returns Promise resolving when all paths are cleaned
 */
export declare function cleanDirectories(paths: string | string[], options?: {
    verbose?: boolean;
    force?: boolean;
}): Promise<void>;
/**
 * Creates a directory if it doesn't exist
 *
 * @param dirPath - Directory path to create
 */
export declare function createDirectory(dirPath: string): Promise<void>;
/**
 * Checks if a directory exists
 *
 * @param dirPath - Directory path to check
 * @returns True if the directory exists
 */
export declare function directoryExists(dirPath: string): Promise<boolean>;
/**
 * Gets a list of files with specific extensions in a directory
 *
 * @param dirPath - Directory path to search
 * @param extensions - Array of file extensions to match (e.g., ['.ts', '.tsx'])
 * @param recursive - Whether to search recursively
 * @returns Array of matching file paths
 */
export declare function getFilesWithExtension(dirPath: string, extensions: string[], recursive?: boolean): Promise<string[]>;
/**
 * Reads a JSON file and parses it
 *
 * @param filePath - Path to the JSON file
 * @returns Parsed JSON content
 */
export declare function readJsonFile<T>(filePath: string): Promise<T>;
/**
 * Reads and parses an .alignignore file
 *
 * @param rootDir - Root directory where .alignignore is located
 * @returns Array of glob patterns to ignore
 */
export declare function readAlignIgnoreFile(rootDir: string): Promise<string[]>;
/**
 * Checks if a file should be ignored based on .alignignore patterns
 *
 * @param filePath - Path of the file to check
 * @param rootDir - Root directory of the project
 * @param ignorePatterns - Patterns to ignore (from .alignignore)
 * @returns True if the file should be ignored, false otherwise
 */
export declare function shouldIgnoreFile(filePath: string, rootDir: string, ignorePatterns: string[]): boolean;
/**
 * Parse file and extract basic information
 *
 * @param filePath Path to the file to parse
 * @returns Basic information about the file structure
 */
export declare function parseFile(filePath: string): Promise<{
    filePath: string;
    content: string & {
        includes: (text: string) => boolean;
    };
    imports: {
        source: string;
        names: string[];
    }[];
    exports: string[];
    functionCalls: {
        name: string;
        args: string[];
    }[];
    includes: (text: string) => boolean;
}>;
