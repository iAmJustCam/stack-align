import { ProjectContext } from './context';
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
export declare function scanProject(context: ProjectContext): Promise<ScanResult>;
