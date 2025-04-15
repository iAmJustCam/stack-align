import type { ProjectContext, ValidationResult } from "../types";
/**
 * Validates project architecture against established guidelines
 */
export declare function validateArchitecture(context: ProjectContext): Promise<ValidationResult>;
