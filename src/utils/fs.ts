import { promises as fs } from 'fs';
import * as path from 'path';
import minimatch from 'minimatch';
// No longer using chalk for console coloring

/**
 * Reads a file from the given path
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Writes content to a file
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures a directory exists, creating it if necessary
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Gets relative path between two absolute paths
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(path.dirname(from), to).replace(/\\/g, '/');
}

/**
 * Clean directories using native fs.rm
 * 
 * @param paths - Single path or array of paths to clean
 * @param options - Optional configuration
 * @returns Promise resolving when all paths are cleaned
 */
export async function cleanDirectories(
  paths: string | string[],
  options: {
    verbose?: boolean;
    force?: boolean;
  } = {}
): Promise<void> {
  const pathsToClean = Array.isArray(paths) ? paths : [paths];
  const { verbose = false, force = true } = options;
  
  if (verbose) {
    console.log('Cleaning directories:');
    pathsToClean.forEach(p => console.log(`  - ${p}`));
  }
  
  await Promise.all(
    pathsToClean.map(async (dirPath) => {
      try {
        await fs.rm(dirPath, { recursive: true, force });
        if (verbose) {
          console.log(`✓ Cleaned ${dirPath}`);
        }
      } catch (error) {
        // Handle common errors
        if (
          error instanceof Error && 
          'code' in error && 
          (error as NodeJS.ErrnoException).code === 'ENOENT'
        ) {
          // Directory doesn't exist, which is fine for a clean operation
          if (verbose) {
            console.log(`! ${dirPath} already clean (doesn't exist)`);
          }
          return;
        }
        
        // Re-throw unexpected errors
        throw error;
      }
    })
  );
}

/**
 * Creates a directory if it doesn't exist
 * 
 * @param dirPath - Directory path to create
 */
export async function createDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Checks if a directory exists
 * 
 * @param dirPath - Directory path to check
 * @returns True if the directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
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
export async function getFilesWithExtension(
  dirPath: string, 
  extensions: string[], 
  recursive = false
): Promise<string[]> {
  const files: string[] = [];
  
  async function processDirectory(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory() && recursive) {
        await processDirectory(entryPath);
      } else if (entry.isFile()) {
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
export async function readJsonFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath);
  return JSON.parse(content) as T;
}

/**
 * Reads and parses an .alignignore file
 * 
 * @param rootDir - Root directory where .alignignore is located
 * @returns Array of glob patterns to ignore
 */
export async function readAlignIgnoreFile(rootDir: string): Promise<string[]> {
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
  } catch (error) {
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
export function shouldIgnoreFile(filePath: string, rootDir: string, ignorePatterns: string[]): boolean {
  if (ignorePatterns.length === 0) {
    return false; // No ignore patterns
  }
  
  // Get the relative path from the root dir
  const relativePath = path.relative(rootDir, filePath);
  
  // Check if any pattern matches
  return ignorePatterns.some(pattern => {
    const matcher = new minimatch.Minimatch(pattern, { dot: true, matchBase: true });
    return matcher.match(relativePath);
  });
}

/**
 * Parse file and extract basic information
 * 
 * @param filePath Path to the file to parse
 * @returns Basic information about the file structure
 */
export async function parseFile(filePath: string): Promise<{
  filePath: string;
  content: string & { includes: (text: string) => boolean };
  imports: { source: string; names: string[] }[];
  exports: string[];
  functionCalls: { name: string; args: string[] }[];
  includes: (text: string) => boolean;
}> {
  const content = await readFile(filePath);
  
  // Perform a simple parsing using regex for common patterns
  // Note: This is not as robust as ts-morph but can be used for simpler files
  
  // Extract imports
  const importRegex = /import\s+(?:{([^}]+)}|\*\s+as\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+))\s+from\s+['"]([^'"]+)['"]/g;
  const imports: { source: string; names: string[] }[] = [];
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const namedImportsText = match[1];
    const namespaceImport = match[2];
    const defaultImport = match[3];
    const importPath = match[4];
    
    const names: string[] = [];
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
  const exports: string[] = [];
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Extract function calls
  const functionCallRegex = /([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g;
  const functionCalls: { name: string; args: string[] }[] = [];
  
  while ((match = functionCallRegex.exec(content)) !== null) {
    const name = match[1];
    const argsText = match[2];
    const args = argsText.split(',').map(arg => arg.trim()).filter(arg => arg !== '');
    
    functionCalls.push({ name, args });
  }
  
  // Add includes method to check for text in the content
  const includes = (text: string): boolean => content.includes(text);
  
  // Create a content object that also has an includes method
  const contentWithIncludes = Object.assign(content, { includes }) as string & { includes: (text: string) => boolean };
  
  return {
    filePath,
    content: contentWithIncludes,
    imports,
    exports,
    functionCalls,
    includes,
  };
}
