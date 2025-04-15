import path from 'path';
import * as globModule from 'glob';
import { ProjectContext } from './context';
import { addSourceFile } from './ast';
import { readAlignIgnoreFile, shouldIgnoreFile } from './fs';

/**
 * Scan result containing discovered files
 */
export interface ScanResult {
  componentFiles: string[];
  hookFiles: string[];
  testFiles: string[];
  typeFiles: string[];
  utilFiles: string[];
  allFiles: string[];
}

/**
 * Scans a project for files
 */
export async function scanProject(context: ProjectContext): Promise<ScanResult> {
  const { rootDir } = context;
  
  // Read .alignignore file if it exists
  const ignorePatterns = await readAlignIgnoreFile(rootDir);
  
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
    return (
      file.endsWith('.tsx') && 
      !file.includes('__tests__') && 
      !file.includes('.test.') && 
      !file.includes('.spec.') &&
      !file.includes('/pages/') && // Next.js pages aren't necessarily components
      !path.basename(file).startsWith('_')
    );
  });
  
  const hookFiles = allFiles.filter(file => {
    const fileName = path.basename(file);
    return fileName.startsWith('use') && fileName.endsWith('.ts');
  });
  
  const testFiles = allFiles.filter(file => {
    return file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.');
  });
  
  const typeFiles = allFiles.filter(file => {
    const fileName = path.basename(file);
    return (
      fileName.includes('.d.ts') || 
      fileName.includes('types.ts') ||
      file.includes('/types/') ||
      file.includes('/interfaces/')
    );
  });
  
  const utilFiles = allFiles.filter(file => {
    return (
      file.includes('/utils/') || 
      file.includes('/helpers/') || 
      file.includes('/lib/')
    );
  });
  
  // Add relevant files to the ts-morph project
  for (const file of allFiles) {
    addSourceFile(context.project, file);
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
async function findFiles(rootDir: string, patterns: string[], ignore: string[] = []): Promise<string[]> {
  const options = {
    cwd: rootDir,
    ignore,
    absolute: true,
    nodir: true,
  };
  
  const results: string[] = [];
  
  for (const pattern of patterns) {
    const files = await new Promise<string[]>((resolve, reject) => {
      // Use the glob API compatible with version 11
      (async () => {
        try {
          const matches = await globModule.glob(pattern, options);
          resolve(matches);
        } catch (err) {
          reject(err);
        }
      })();
    });
    
    results.push(...files);
  }
  
  // Return unique files
  return [...new Set(results)];
}
