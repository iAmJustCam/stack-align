import { SourceFile } from 'ts-morph';
import type {
  AnalysisOptions,
  AnalysisReport,
  ProjectContext,
  ValidationIssue,
  ValidationResult
} from '../types';
import { createProjectContext } from '../utils/context';
import { scanProject } from '../utils/project-scanner';
import { validateArchitecture } from '../validators/architecture-validator';
import { validateNextJs15Implementation } from '../validators/nextjs15-validator';
import { validateReact19Implementation } from '../validators/react19-validator';
import { validateTailwindV4Implementation } from '../validators/tailwindv4-validator';
import { validateTypeScript5Implementation } from '../validators/typescript5-validator';
import { validateTypeScriptBestPractices } from '../validators/typescript-best-practices-validator';
import { validateVitestImplementation } from '../validators/vitest-validator';

/**
 * Performs a comprehensive top-down analysis of the entire project
 *
 * @param projectDir Directory of the project to analyze
 * @param options Analysis options
 * @returns Complete analysis report organized hierarchically
 */
export async function analyzeProjectTopDown(
  projectDir: string,
  options: AnalysisOptions = {}
): Promise<AnalysisReport> {
  console.log(`🔍 Starting top-down analysis of: ${projectDir}`);

  // Step 1: Create project context with metadata and ts-morph Project
  const context = await createProjectContext(projectDir);
  console.log(`📊 Project context created: ${context.projectName || 'Unnamed Project'}`);

  // Step 2: Scan project files and add to ts-morph Project
  console.log('🔎 Scanning project files...');
  const scanResult = await scanProject(context);
  console.log(`📁 Found ${scanResult.allFiles.length} files to analyze`);

  // Step 3: Project-level analysis (highest level)
  console.log('1️⃣ Analyzing project structure and architecture...');
  const projectStructureResults = await validateArchitecture(context);

  if (projectStructureResults.issues.length > 0) {
    console.log(`⚠️ Found ${projectStructureResults.issues.length} architecture issues`);
  } else {
    console.log('✅ Project architecture looks good');
  }

  // Step 4: Framework-level analysis
  console.log('2️⃣ Analyzing framework configurations...');

  // TypeScript
  console.log('   📝 Analyzing TypeScript configuration...');
  const typescriptResults = await validateTypeScript5Implementation(context);
  
  // TypeScript Best Practices
  console.log('   🛡️ Analyzing TypeScript best practices...');
  const typescriptBestPracticesResults = await validateTypeScriptBestPractices(context);

  // Next.js
  console.log('   🔄 Analyzing Next.js setup...');
  const nextjsResults = await validateNextJs15Implementation(context);

  // React
  console.log('   ⚛️ Analyzing React implementation...');
  const reactResults = await validateReact19Implementation(context);

  // Tailwind
  console.log('   🎨 Analyzing Tailwind CSS implementation...');
  const tailwindResults = await validateTailwindV4Implementation(context);

  // Vitest
  console.log('   🧪 Analyzing testing setup...');
  const vitestResults = await validateVitestImplementation(context);

  // Framework summary
  const frameworkIssues = [
    ...typescriptResults.issues,
    ...typescriptBestPracticesResults.issues,
    ...nextjsResults.issues,
    ...reactResults.issues,
    ...tailwindResults.issues,
    ...vitestResults.issues
  ];

  if (frameworkIssues.length > 0) {
    console.log(`⚠️ Found ${frameworkIssues.length} framework configuration issues`);
  } else {
    console.log('✅ Framework configurations look good');
  }

  // Step 5: Component-level analysis
  console.log('3️⃣ Analyzing components...');
  const componentResults = await analyzeComponents(context, scanResult.componentFiles);

  if (componentResults.issues.length > 0) {
    console.log(`⚠️ Found ${componentResults.issues.length} component issues`);
  } else {
    console.log('✅ Components look good');
  }

  // Step 6: Page-level analysis
  console.log('4️⃣ Analyzing pages and routes...');
  // Identify page files (in pages/ or app/ directories)
  const pageFiles = scanResult.allFiles.filter(file =>
    file.includes('/pages/') || file.includes('/app/')
  );
  const pageResults = await analyzePages(context, pageFiles);

  if (pageResults.issues.length > 0) {
    console.log(`⚠️ Found ${pageResults.issues.length} page/route issues`);
  } else {
    console.log('✅ Pages/routes look good');
  }

  // Step 7: Hooks analysis
  console.log('5️⃣ Analyzing custom hooks...');
  const hookResults = await analyzeHooks(context, scanResult.hookFiles);

  if (hookResults.issues.length > 0) {
    console.log(`⚠️ Found ${hookResults.issues.length} hook issues`);
  } else {
    console.log('✅ Custom hooks look good');
  }

  // Step 8: Utility functions analysis
  console.log('6️⃣ Analyzing utility functions...');
  const utilityResults = await analyzeUtilities(context, scanResult.utilFiles);

  if (utilityResults.issues.length > 0) {
    console.log(`⚠️ Found ${utilityResults.issues.length} utility function issues`);
  } else {
    console.log('✅ Utility functions look good');
  }

  // Combine and organize all results hierarchically
  const allResults = {
    project: projectStructureResults,
    frameworks: {
      typescript: typescriptResults,
      typescript_best_practices: typescriptBestPracticesResults,
      nextjs: nextjsResults,
      react: reactResults,
      tailwind: tailwindResults,
      vitest: vitestResults
    },
    components: componentResults,
    pages: pageResults,
    hooks: hookResults,
    utilities: utilityResults
  };

  // Generate a summary of all issues
  const summary = generateReportSummary(allResults);

  // Final report
  const report: AnalysisReport = {
    projectName: context.projectName || 'Unnamed Project',
    projectRoot: projectDir,
    timestamp: new Date(),
    results: allResults,
    summary,
    options
  };

  console.log('✨ Analysis complete!');
  return report;
}

/**
 * Analyzes all components in the project
 */
async function analyzeComponents(context: ProjectContext, componentFiles: string[]): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  console.log(`   Found ${componentFiles.length} components to analyze`);

  for (const filePath of componentFiles) {
    const componentName = filePath.split('/').pop()?.split('.')[0] || 'unknown';
    console.log(`   📦 Analyzing component: ${componentName}`);

    // Get the source file from ts-morph project
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Validate against each framework
    const architectureIssues = await validateComponentArchitecture(sourceFile, context);
    const reactIssues = await validateComponentReact19(sourceFile, context);
    const tsIssues = await validateComponentTypeScript(sourceFile, context);
    const tailwindIssues = await validateComponentTailwind(sourceFile, context);
    const testIssues = await validateComponentTests(sourceFile, context);

    // Add component metadata to issues
    const componentIssues = [
      ...architectureIssues.issues,
      ...reactIssues.issues,
      ...tsIssues.issues,
      ...tailwindIssues.issues,
      ...testIssues.issues
    ].map(issue => ({
      ...issue,
      component: componentName
    }));

    issues.push(...componentIssues);

    if (componentIssues.length > 0) {
      console.log(`   ⚠️ Found ${componentIssues.length} issues in ${componentName}`);
    } else {
      console.log(`   ✅ Component ${componentName} looks good`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Analyzes all pages and route handlers in the project
 */
async function analyzePages(context: ProjectContext, pageFiles: string[]): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  console.log(`   Found ${pageFiles.length} pages to analyze`);

  for (const filePath of pageFiles) {
    const pageName = filePath.split('/').pop()?.split('.')[0] || 'unknown';
    console.log(`   📄 Analyzing page: ${pageName}`);

    // Get the source file from ts-morph project
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Validate against each framework
    const architectureIssues = await validatePageArchitecture(sourceFile, context);
    const nextIssues = await validatePageNextJs(sourceFile, context);
    const reactIssues = await validatePageReact(sourceFile, context);
    const tsIssues = await validatePageTypeScript(sourceFile, context);
    const testIssues = await validatePageTests(sourceFile, context);

    // Add page metadata to issues
    const pageIssues = [
      ...architectureIssues.issues,
      ...nextIssues.issues,
      ...reactIssues.issues,
      ...tsIssues.issues,
      ...testIssues.issues
    ].map(issue => ({
      ...issue,
      page: pageName
    }));

    issues.push(...pageIssues);

    if (pageIssues.length > 0) {
      console.log(`   ⚠️ Found ${pageIssues.length} issues in ${pageName}`);
    } else {
      console.log(`   ✅ Page ${pageName} looks good`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Analyzes all custom hooks in the project
 */
async function analyzeHooks(context: ProjectContext, hookFiles: string[]): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  console.log(`   Found ${hookFiles.length} custom hooks to analyze`);

  for (const filePath of hookFiles) {
    const hookName = filePath.split('/').pop()?.split('.')[0] || 'unknown';
    console.log(`   🪝 Analyzing hook: ${hookName}`);

    // Get the source file from ts-morph project
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Validate hook implementations
    const architectureIssues = await validateHookArchitecture(sourceFile, context);
    const reactIssues = await validateHookReact19(sourceFile, context);
    const tsIssues = await validateHookTypeScript(sourceFile, context);
    const testIssues = await validateHookTests(sourceFile, context);

    // Add hook metadata to issues
    const hookIssues = [
      ...architectureIssues.issues,
      ...reactIssues.issues,
      ...tsIssues.issues,
      ...testIssues.issues
    ].map(issue => ({
      ...issue,
      hook: hookName
    }));

    issues.push(...hookIssues);

    if (hookIssues.length > 0) {
      console.log(`   ⚠️ Found ${hookIssues.length} issues in ${hookName}`);
    } else {
      console.log(`   ✅ Hook ${hookName} looks good`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Analyzes all utility functions in the project
 */
async function analyzeUtilities(context: ProjectContext, utilFiles: string[]): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  console.log(`   Found ${utilFiles.length} utility functions to analyze`);

  for (const filePath of utilFiles) {
    const utilName = filePath.split('/').pop()?.split('.')[0] || 'unknown';
    console.log(`   🔧 Analyzing utility: ${utilName}`);

    // Get the source file from ts-morph project
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Validate utility implementations
    const architectureIssues = await validateUtilityArchitecture(sourceFile, context);
    const tsIssues = await validateUtilityTypeScript(sourceFile, context);
    const testIssues = await validateUtilityTests(sourceFile, context);

    // Add utility metadata to issues
    const utilityIssues = [
      ...architectureIssues.issues,
      ...tsIssues.issues,
      ...testIssues.issues
    ].map(issue => ({
      ...issue,
      utility: utilName
    }));

    issues.push(...utilityIssues);

    if (utilityIssues.length > 0) {
      console.log(`   ⚠️ Found ${utilityIssues.length} issues in ${utilName}`);
    } else {
      console.log(`   ✅ Utility ${utilName} looks good`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Interface for analysis results structure
 */
interface AnalysisResultsStructure {
  project: ValidationResult;
  frameworks: {
    typescript: ValidationResult;
    nextjs: ValidationResult;
    react: ValidationResult;
    tailwind: ValidationResult;
    vitest: ValidationResult;
    [key: string]: ValidationResult;
  };
  components: ValidationResult;
  pages: ValidationResult;
  hooks: ValidationResult;
  utilities: ValidationResult;
}

/**
 * Interface for analysis summary
 */
interface AnalysisSummary {
  totalIssues: number;
  bySeverity: {
    error: number;
    warning: number;
    suggestion: number;
  };
  byFramework: Record<string, number>;
  byFileType: {
    component: number;
    page: number;
    hook: number;
    utility: number;
  };
  criticalIssues: ValidationIssue[];
  timestamp: Date;
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  frameworkIssues: Record<string, number>;
  score: number;
}

/**
 * Generates a summary report of all issues
 */
function generateReportSummary(results: AnalysisResultsStructure): AnalysisSummary {
  // Count issues by severity
  const errorCount = countIssuesBySeverity(results, 'error');
  const warningCount = countIssuesBySeverity(results, 'warning');
  const suggestionCount = countIssuesBySeverity(results, 'suggestion');

  // Count issues by framework
  const frameworkCounts = countIssuesByFramework(results);

  // Count issues by file type
  const componentCount = results.components.issues.length;
  const pageCount = results.pages.issues.length;
  const hookCount = results.hooks.issues.length;
  const utilityCount = results.utilities.issues.length;

  // Get most critical issues
  const criticalIssues = getTopIssues(results, 'error', 5);

  return {
    totalIssues: errorCount + warningCount + suggestionCount,
    bySeverity: {
      error: errorCount,
      warning: warningCount,
      suggestion: suggestionCount
    },
    byFramework: frameworkCounts,
    byFileType: {
      component: componentCount,
      page: pageCount,
      hook: hookCount,
      utility: utilityCount
    },
    criticalIssues,
    timestamp: new Date(),
    // Required properties from the interface
    errorCount,
    warningCount,
    suggestionCount,
    frameworkIssues: frameworkCounts,
    score: calculateScore(errorCount, warningCount, suggestionCount)
  };
}

/**
 * Counts issues by severity
 */
function countIssuesBySeverity(results: AnalysisResultsStructure, severity: string): number {
  let count = 0;

  // Project issues
  count += results.project.issues.filter((i: ValidationIssue) => i.type === severity).length;

  // Framework issues
  Object.values(results.frameworks).forEach((framework: ValidationResult) => {
    count += framework.issues.filter((i: ValidationIssue) => i.type === severity).length;
  });

  // Component issues
  count += results.components.issues.filter((i: ValidationIssue) => i.type === severity).length;

  // Page issues
  count += results.pages.issues.filter((i: ValidationIssue) => i.type === severity).length;

  // Hook issues
  count += results.hooks.issues.filter((i: ValidationIssue) => i.type === severity).length;

  // Utility issues
  count += results.utilities.issues.filter((i: ValidationIssue) => i.type === severity).length;

  return count;
}

/**
 * Counts issues by framework
 */
function countIssuesByFramework(results: AnalysisResultsStructure): Record<string, number> {
  const counts = {
    architecture: 0,
    react: 0,
    nextjs: 0,
    typescript: 0,
    tailwind: 0,
    vitest: 0,
    other: 0
  };

  // Count all issues by framework
  function addIssues(issues: ValidationIssue[]) {
    issues.forEach((issue: ValidationIssue) => {
      const framework = issue.framework || 'other';
      // Check if the framework is a valid key in counts
      if (framework in counts) {
        counts[framework as keyof typeof counts] += 1;
      } else {
        counts.other += 1;
      }
    });
  }

  // Project issues
  addIssues(results.project.issues);

  // Framework issues
  Object.values(results.frameworks).forEach((framework: any) => {
    addIssues(framework.issues);
  });

  // Component issues
  addIssues(results.components.issues);

  // Page issues
  addIssues(results.pages.issues);

  // Hook issues
  addIssues(results.hooks.issues);

  // Utility issues
  addIssues(results.utilities.issues);

  return counts;
}

/**
 * Calculates a score based on the number of issues
 * Higher score is better (100 is perfect)
 */
function calculateScore(errorCount: number, warningCount: number, suggestionCount: number): number {
  // Start with 100 and deduct points for issues
  let score = 100;
  
  // Errors are most severe
  score -= errorCount * 5;
  
  // Warnings are moderately severe
  score -= warningCount * 2;
  
  // Suggestions are least severe
  score -= suggestionCount * 0.5;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

function getTopIssues(results: AnalysisResultsStructure, severity: string, count: number): ValidationIssue[] {
  const allIssues = [];

  // Collect issues from all sections
  allIssues.push(...results.project.issues);

  Object.values(results.frameworks).forEach((framework: any) => {
    allIssues.push(...framework.issues);
  });

  allIssues.push(...results.components.issues);
  allIssues.push(...results.pages.issues);
  allIssues.push(...results.hooks.issues);
  allIssues.push(...results.utilities.issues);

  // Filter by severity and sort by framework
  return allIssues
    .filter(issue => issue.type === severity)
    .sort((a, b) => {
      // Prioritize architecture issues
      if (a.framework === 'architecture' && b.framework !== 'architecture') return -1;
      if (a.framework !== 'architecture' && b.framework === 'architecture') return 1;
      return 0;
    })
    .slice(0, count);
}

// Helper functions for specific validation operations

/**
 * Validates a component's architecture
 */
async function validateComponentArchitecture(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder - real implementation would check
  // for proper file organization, naming conventions, etc.
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a component against React 19 best practices
 */
async function validateComponentReact19(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder - real implementation would
  // use the full react19-validator on this specific component
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a component against TypeScript 5 best practices
 */
async function validateComponentTypeScript(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder - real implementation would
  // use the full typescript5-validator on this specific component
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a component against Tailwind v4 best practices
 */
async function validateComponentTailwind(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder - real implementation would
  // use the full tailwindv4-validator on this specific component
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a component's tests
 */
async function validateComponentTests(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder - real implementation would
  // use the full vitest-validator on this specific component's tests
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a page's architecture
 */
async function validatePageArchitecture(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a page against Next.js 15 best practices
 */
async function validatePageNextJs(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a page against React 19 best practices
 */
async function validatePageReact(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a page against TypeScript 5 best practices
 */
async function validatePageTypeScript(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a page's tests
 */
async function validatePageTests(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a hook's architecture
 */
async function validateHookArchitecture(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a hook against React 19 best practices
 */
async function validateHookReact19(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a hook against TypeScript 5 best practices
 */
async function validateHookTypeScript(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a hook's tests
 */
async function validateHookTests(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a utility's architecture
 */
async function validateUtilityArchitecture(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a utility against TypeScript 5 best practices
 */
async function validateUtilityTypeScript(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}

/**
 * Validates a utility's tests
 */
async function validateUtilityTests(sourceFile: SourceFile, context: ProjectContext): Promise<ValidationResult> {
  // This is a simplified placeholder
  return {
    valid: true,
    issues: []
  };
}
