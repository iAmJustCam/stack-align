import type { AnalysisResults, HealingOptions, HealingReport, ProjectContext } from '../types';
/**
 * Heals a project based on analysis results
 *
 * @param context Project context
 * @param results Analysis results containing issues
 * @param options Healing options
 * @returns Healing report detailing all operations performed
 */
export declare function healProject(context: ProjectContext, results: AnalysisResults, options?: HealingOptions): Promise<HealingReport>;
