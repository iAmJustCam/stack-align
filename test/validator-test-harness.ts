import * as path from 'path';
import { Project } from 'ts-morph';
import { readFile, writeFile } from '../src/utils/fs';
import { createProjectContext } from '../src/utils/context';
import { validateReact19Implementation } from '../src/validators/react19-validator';
import { validateNextJs15Implementation } from '../src/validators/nextjs15-validator';
import { validateTypeScript5Implementation } from '../src/validators/typescript5-validator';
import { validateTailwindV4Implementation } from '../src/validators/tailwindv4-validator';
import { validateVitestImplementation } from '../src/validators/vitest-validator';
import { ValidationIssue, ValidationResult, ProjectContext } from '../src/types';

/**
 * Test harness for validating the detection capabilities of the validators
 */
interface ValidationTestResult {
  validator: string;
  fixture: string;
  expected: {
    shouldDetect: boolean;
    issueCode?: string;
  };
  actual: {
    detected: boolean;
    issues: ValidationIssue[];
  };
  passed: boolean;
}

/**
 * Test fixtures definition
 */
const testFixtures = [
  {
    validator: 'react',
    fixture: 'bad-hook-nesting.tsx',
    expectIssueCode: 'REACT19_CONDITIONAL_HOOK',
  },
  {
    validator: 'react',
    fixture: 'find-dom-node.tsx',
    expectIssueCode: 'REACT19_FIND_DOM_NODE',
  },
  {
    validator: 'react',
    fixture: 'string-refs.tsx',
    expectIssueCode: 'REACT19_STRING_REFS',
  },
  {
    validator: 'typescript',
    fixture: 'missing-type-imports.ts',
    expectIssueCode: 'TS5_MISSING_IMPORT_TYPE',
  },
  {
    validator: 'typescript',
    fixture: 'needs-satisfies-operator.ts',
    expectIssueCode: 'TS5_USE_SATISFIES',
  },
  {
    validator: 'typescript',
    fixture: 'untyped-component.tsx',
    expectIssueCode: 'TS5_MISSING_PROPS_INTERFACE',
  },
  {
    validator: 'nextjs',
    fixture: 'sync-layout-cookies.tsx',
    expectIssueCode: 'NEXTJS15_SYNC_LAYOUT_API',
  },
  {
    validator: 'nextjs',
    fixture: 'missing-metadata.tsx',
    expectIssueCode: 'NEXTJS15_MISSING_METADATA',
  },
  {
    validator: 'tailwind',
    fixture: 'directional-classes.tsx',
    expectIssueCode: 'TAILWIND_DIRECTIONAL_CLASSES',
  },
  {
    validator: 'tailwind',
    fixture: 'deprecated-utilities.tsx',
    expectIssueCode: 'TAILWIND_DEPRECATED_UTILITIES',
  },
  {
    validator: 'vitest',
    fixture: 'incomplete-component-test.test.tsx',
    expectIssueCode: 'VITEST_INCOMPLETE_TEST',
  },
];

/**
 * Creates a temporary project context for testing
 */
async function createTempProjectContext(fixtureDir: string): Promise<ProjectContext> {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    skipFileDependencyResolution: true
  });

  // Create a minimal context with just what's needed for validation
  return {
    rootDir: path.resolve(__dirname, '..'), // Use the project root 
    project,
    projectName: 'test-fixture',
  };
}

/**
 * Runs the appropriate validator for a fixture
 */
async function runValidator(validator: string, context: ProjectContext): Promise<ValidationResult> {
  switch (validator) {
    case 'react':
      return validateReact19Implementation(context);
    case 'nextjs':
      return validateNextJs15Implementation(context);
    case 'typescript':
      return validateTypeScript5Implementation(context);
    case 'tailwind':
      return validateTailwindV4Implementation(context);
    case 'vitest':
      return validateVitestImplementation(context);
    default:
      throw new Error(`Unknown validator: ${validator}`);
  }
}

/**
 * Runs validation tests against all fixtures
 */
export async function runValidationTests(): Promise<ValidationTestResult[]> {
  const results: ValidationTestResult[] = [];
  const fixturesDir = path.resolve(__dirname, 'fixtures');

  for (const fixture of testFixtures) {
    const fixturePath = path.join(fixturesDir, fixture.validator, fixture.fixture);
    const fixtureDir = path.dirname(fixturePath);
    
    // Create temp context for this fixture
    const context = await createTempProjectContext(fixtureDir);
    
    // Add the fixture file to the project
    context.project.addSourceFileAtPath(fixturePath);
    
    // Run validation
    const validationResult = await runValidator(fixture.validator, context);
    
    // Check if the expected issue was found
    const detectedIssue = validationResult.issues.find(
      issue => issue.code === fixture.expectIssueCode
    );
    
    // Record result
    results.push({
      validator: fixture.validator,
      fixture: fixture.fixture,
      expected: {
        shouldDetect: true,
        issueCode: fixture.expectIssueCode,
      },
      actual: {
        detected: !!detectedIssue,
        issues: validationResult.issues,
      },
      passed: !!detectedIssue,
    });
  }

  return results;
}

/**
 * Prints the validation test results to the console
 */
function printResults(results: ValidationTestResult[]) {
  console.log('\n🧪 Validation Test Results:');
  console.log('-------------------------\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`✅ ${passed}/${total} tests passed`);
  
  // Group by validator
  const byValidator = results.reduce((acc, result) => {
    acc[result.validator] = acc[result.validator] || [];
    acc[result.validator].push(result);
    return acc;
  }, {} as Record<string, ValidationTestResult[]>);
  
  // Print results by validator
  Object.entries(byValidator).forEach(([validator, validatorResults]) => {
    const validatorPassed = validatorResults.filter(r => r.passed).length;
    console.log(`\n${validator}: ${validatorPassed}/${validatorResults.length} tests passed`);
    
    validatorResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${status} ${result.fixture}`);
      
      if (!result.passed) {
        console.log(`    Expected to find issue: ${result.expected.issueCode}`);
        console.log(`    Actually found issues: ${result.actual.issues.map(i => i.code).join(', ') || 'none'}`);
      }
    });
  });
}

/**
 * Main function to run all validation tests
 */
export async function runAllTests() {
  const results = await runValidationTests();
  printResults(results);
  
  // Exit with error code if any tests failed
  const allPassed = results.every(r => r.passed);
  if (!allPassed) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}