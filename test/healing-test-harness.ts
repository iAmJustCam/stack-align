import * as path from 'path';
import { promises as fs } from 'fs';
import { Project } from 'ts-morph';
import { createProjectContext } from '../src/utils/context';
import { healProject } from '../src/healers/healing-engine';
import { ProjectContext, ValidationIssue, ValidationResult, AnalysisResults } from '../src/types';
import { convertToTypeOnlyImport, convertToSatisfiesOperator } from '../src/validators/typescript5-validator';

/**
 * Test harness for validating the healing (fix) capabilities
 */
interface HealingTestResult {
  fixture: string;
  validator: string;
  issueCode: string;
  beforeContent: string;
  afterContent: string;
  transformerOutput?: string;
  passed: boolean;
  error?: string;
}

/**
 * Test fixtures with transformer functions
 */
const transformerFixtures = [
  {
    fixture: 'missing-type-imports.ts',
    validator: 'typescript',
    issueCode: 'TS5_MISSING_IMPORT_TYPE',
    transformer: convertToTypeOnlyImport as (content: string, context: any) => string,
    transformContext: {
      importDeclaration: "import { User, Role } from './types';",
      line: 4,
    },
    expectedChange: "import type { User, Role } from './types';",
  },
  {
    fixture: 'needs-satisfies-operator.ts',
    validator: 'typescript',
    issueCode: 'TS5_USE_SATISFIES',
    transformer: convertToSatisfiesOperator as (content: string, context: any) => string,
    transformContext: {
      variableName: 'darkTheme',
      line: 13,
    },
    expectedChange: 'satisfies Theme',
  }
];

/**
 * Tests transformer functions directly
 */
async function testTransformers(): Promise<HealingTestResult[]> {
  const results: HealingTestResult[] = [];
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  
  for (const fixture of transformerFixtures) {
    try {
      const fixturePath = path.join(fixturesDir, fixture.validator, fixture.fixture);
      const content = await fs.readFile(fixturePath, 'utf8');
      
      // Apply transformer
      const transformedContent = fixture.transformer(content, fixture.transformContext);
      
      // Check if the transformation succeeded
      const passed = transformedContent.includes(fixture.expectedChange);
      
      results.push({
        fixture: fixture.fixture,
        validator: fixture.validator,
        issueCode: fixture.issueCode,
        beforeContent: content,
        afterContent: transformedContent,
        transformerOutput: transformedContent,
        passed,
        error: passed ? undefined : 'Transformation failed to make expected change',
      });
    } catch (error) {
      results.push({
        fixture: fixture.fixture,
        validator: fixture.validator,
        issueCode: fixture.issueCode,
        beforeContent: '',
        afterContent: '',
        passed: false,
        error: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
  
  return results;
}

/**
 * Creates mock validation results for testing healing
 */
function createMockValidationResults(issues: ValidationIssue[]): AnalysisResults {
  const mockResult: ValidationResult = {
    valid: issues.length === 0,
    issues,
  };
  
  return {
    project: { valid: true, issues: [] },
    frameworks: {
      typescript: mockResult,
      typescript_best_practices: { valid: true, issues: [] },
      nextjs: { valid: true, issues: [] },
      react: { valid: true, issues: [] },
      tailwind: { valid: true, issues: [] },
      vitest: { valid: true, issues: [] },
    },
    components: { valid: true, issues: [] },
    pages: { valid: true, issues: [] },
    hooks: { valid: true, issues: [] },
    utilities: { valid: true, issues: [] },
  };
}

/**
 * Prints the healing test results to the console
 */
function printHealingResults(results: HealingTestResult[]) {
  console.log('\n🔧 Healing Test Results:');
  console.log('------------------------\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`✅ ${passed}/${total} tests passed`);
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} ${result.validator}/${result.fixture} (${result.issueCode})`);
    
    if (!result.passed) {
      console.log(`  Error: ${result.error}`);
      console.log('\n  Before:');
      console.log(`  ${result.beforeContent.split('\n')[0]}...`);
      console.log('\n  After:');
      console.log(`  ${result.afterContent.split('\n')[0]}...`);
    }
  });
}

/**
 * Main function to run all transformer tests
 */
export async function runAllTransformerTests() {
  const results = await testTransformers();
  printHealingResults(results);
  
  // Exit with error code if any tests failed
  const allPassed = results.every(r => r.passed);
  if (!allPassed) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTransformerTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}