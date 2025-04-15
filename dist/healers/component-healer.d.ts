import type { TransformationResult, ValidationIssue } from '../types';
/**
 * Heals a React component to make it compliant with best practices
 *
 * @param componentPath Path to the component file
 * @param issues ValidationIssues to fix
 * @param options Healing options
 */
export declare function healComponent(componentPath: string, issues: ValidationIssue[], options?: {
    dryRun?: boolean;
    generateTests?: boolean;
    migrateToTypeScript?: boolean;
    moveToSrc?: boolean;
}): Promise<TransformationResult>;
