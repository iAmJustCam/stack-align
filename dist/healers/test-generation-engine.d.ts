import type { ComponentContext, TestGenerationOptions, TestGenerationResult, ProjectContext } from '../types';
import { SourceFile } from 'ts-morph';
/**
 * Result type for test generation operations
 */
export interface TestOperation {
    type: string;
    filePath?: string;
    testPath?: string;
    entityKind?: 'component' | 'hook' | 'utility' | 'unknown';
    entityName?: string;
    success: boolean;
    description: string;
}
/**
 * Result type for test generation process
 */
export interface TestGenerationOutput {
    operations: TestOperation[];
    success: boolean;
    timestamp: Date;
    summary: {
        total: number;
        componentTests: number;
        hookTests: number;
        utilityTests: number;
        created: number;
        skipped: number;
    };
}
/**
 * Identifies the kind of exportable entity in a source file
 * This is a key part of context-aware test generation
 */
export declare function getExportableEntityKind(sourceFile: SourceFile): {
    kind: 'component' | 'hook' | 'utility' | 'unknown';
    name: string | null;
};
/**
 * Generates comprehensive test files for components and hooks
 *
 * @param context Project context
 * @param options Test generation options
 */
export declare function generateTests(context: ProjectContext, options?: TestGenerationOptions): Promise<TestGenerationOutput>;
/**
 * Generates tests for all components
 */
export declare function generateComponentTests(context: ProjectContext, options?: TestGenerationOptions): Promise<TestOperation[]>;
/**
 * Generates test for a specific component
 *
 * @param componentPath Path to the component file
 * @param componentContext Component metadata
 * @param dryRun Whether to actually create the file
 */
export declare function generateTestForComponent(componentPath: string, componentContext: ComponentContext, dryRun?: boolean): Promise<TestGenerationResult>;
/**
 * Generates tests for all hooks
 */
export declare function generateHookTests(context: ProjectContext, options?: TestGenerationOptions): Promise<TestOperation[]>;
/**
 * Generates tests for utility functions
 */
export declare function generateUtilityTests(context: ProjectContext, options?: TestGenerationOptions): Promise<TestOperation[]>;
