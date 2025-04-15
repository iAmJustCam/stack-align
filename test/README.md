# Healer Test Suite

This directory contains test fixtures and test harnesses for validating the detection and healing capabilities of the Tech Stack Alignment System.

## Test Structure

The test suite is organized as follows:

- `fixtures/`: Contains sample files with known issues for each validator
  - `react/`: React 19 validation fixtures
  - `nextjs/`: Next.js 15 validation fixtures
  - `typescript/`: TypeScript 5 validation fixtures
  - `tailwind/`: Tailwind v4 validation fixtures
  - `vitest/`: Vitest validation fixtures

- `validator-test-harness.ts`: Tests that validators correctly identify issues
- `healing-test-harness.ts`: Tests that transformers correctly apply fixes
- `run-tests.ts`: Runs all test suites

## Running Tests

### Run all system tests
```bash
npm run test:system
```

### Run only validator detection tests
```bash
npm run test:validator
```

### Run only healing transformer tests
```bash
npm run test:healing
```

## Adding New Test Fixtures

To add a new test fixture:

1. Create a new file in the appropriate `fixtures/` subdirectory
2. Add the fixture to the `testFixtures` array in `validator-test-harness.ts`
3. If testing transformers, add it to `transformerFixtures` in `healing-test-harness.ts`

## Test Coverage

The test suite covers:

1. **Validator Detection**: Tests that each validator correctly identifies the issues it's supposed to detect
2. **Healing Transformations**: Tests that transformers correctly apply fixes to issues
3. **Edge Cases**: Tests that the system handles various edge cases and unexpected inputs

## Golden Snapshots

For some transformations, we use "golden snapshots" - predefined expected outputs after transformation to validate the healing process.

## CI Integration

The test suite is designed to run in CI with proper exit codes to indicate test success or failure.

## Extending the Test Suite

To add tests for a new validator:

1. Add a new subdirectory in `fixtures/`
2. Create sample files with known issues
3. Update the test harnesses to include the new validator
4. Add the validator function import in the test harnesses