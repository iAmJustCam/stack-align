import type { AnalysisOptions, AnalysisReport } from '../types';
/**
 * Performs a comprehensive top-down analysis of the entire project
 *
 * @param projectDir Directory of the project to analyze
 * @param options Analysis options
 * @returns Complete analysis report organized hierarchically
 */
export declare function analyzeProjectTopDown(projectDir: string, options?: AnalysisOptions): Promise<AnalysisReport>;
