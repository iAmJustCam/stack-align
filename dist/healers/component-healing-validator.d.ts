import { SourceFile } from 'ts-morph';
import type { ValidationIssue } from '../types';
/**
 * Validates that a healing operation will produce valid code
 *
 * @param sourceFile The source file to validate
 * @param transformedContent The transformed content to validate
 * @returns Array of validation issues
 */
export declare function validateTransformedCode(sourceFile: SourceFile, transformedContent: string): ValidationIssue[];
