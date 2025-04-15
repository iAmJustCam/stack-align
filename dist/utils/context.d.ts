import { Project } from 'ts-morph';
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
export declare function createProjectContext(rootDir: string): ProjectContext;
/**
 * Gets the relative path from the project root
 */
export declare function getRelativePathFromRoot(context: ProjectContext, absolutePath: string): string;
/**
 * Gets the absolute path from a path relative to the project root
 */
export declare function getAbsolutePathFromRoot(context: ProjectContext, relativePath: string): string;
