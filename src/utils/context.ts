import path from 'path';
import fs from 'fs';
import { Project } from 'ts-morph';
import { createProject } from './ast';

export interface ProjectContext {
  rootDir: string;
  project: Project;
  projectName: string;
  tsconfig?: {
    path: string;
    content: Record<string, unknown>;
  };
  packageJson?: {
    path: string;
    content: Record<string, unknown>;
  };
  stackAlignConfig?: {
    path: string;
    content: Record<string, unknown>;
  };
}

/**
 * Creates a project context from a root directory
 */
export function createProjectContext(rootDir: string): ProjectContext {
  const context: ProjectContext = {
    rootDir,
    project: createProject(),
    projectName: path.basename(rootDir),
  };

  // Try to load tsconfig.json
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfigContent = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      context.tsconfig = {
        path: tsconfigPath,
        content: tsconfigContent,
      };
    } catch (error) {
      console.warn(`Error parsing tsconfig.json:`, error);
    }
  }

  // Try to load package.json
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJsonContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      context.packageJson = {
        path: packageJsonPath,
        content: packageJsonContent,
      };
    } catch (error) {
      console.warn(`Error parsing package.json:`, error);
    }
  }

  // Try to load stack-align.config.js
  const stackAlignConfigPath = path.join(rootDir, 'stack-align.config.js');
  if (fs.existsSync(stackAlignConfigPath)) {
    try {
      // We won't actually require() the file here to avoid executing it
      // Just record that it exists for now
      context.stackAlignConfig = {
        path: stackAlignConfigPath,
        content: {}, // Would be populated when needed
      };
    } catch (error) {
      console.warn(`Error parsing stack-align.config.js:`, error);
    }
  }

  return context;
}

/**
 * Gets the relative path from the project root
 */
export function getRelativePathFromRoot(context: ProjectContext, absolutePath: string): string {
  return path.relative(context.rootDir, absolutePath);
}

/**
 * Gets the absolute path from a path relative to the project root
 */
export function getAbsolutePathFromRoot(context: ProjectContext, relativePath: string): string {
  return path.resolve(context.rootDir, relativePath);
}
