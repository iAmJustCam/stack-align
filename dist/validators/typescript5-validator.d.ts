import type { ProjectContext, ValidationResult } from '../types';
/**
 * Validates TypeScript 5 implementation in a project
 */
export declare function validateTypeScript5Implementation(context: ProjectContext): Promise<ValidationResult>;
/**
 * Transformer function to convert regular imports to type-only imports
 * Can be registered as a fix transformer
 */
export declare function convertToTypeOnlyImport(content: string, context: {
    importDeclaration: string;
    line: number;
}): string;
/**
 * Transformer function to convert a variable declaration with type annotation to use the satisfies operator
 * Can be registered as a fix transformer
 */
export declare function convertToSatisfiesOperator(content: string, context: {
    variableName: string;
    line: number;
}): string;
