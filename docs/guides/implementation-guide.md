# Tech Stack Align Implementation Guide

This guide provides detailed information on how to implement the Tech Stack Align system in your project.

## Installation

```bash
npm install --save-dev @tech-stack/align
```

## Basic Usage

Create a `stack-align.config.js` file in your project root:

```js
module.exports = {
  strict: true,
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}', '**/node_modules/**'],
  frameworks: {
    react: '19.0.0',
    nextjs: '15.0.0',
    typescript: '5.0.0',
    tailwind: '4.0.0',
  },
  testing: {
    framework: 'vitest',
    coverage: 80,
  },
};
```

Run the analyzer:

```bash
npx stack-align analyze
```

Or fix issues automatically:

```bash
npx stack-align heal
```

## Configuration Options

### Basic Options

- `strict`: Enable strict validation mode (default: `false`)
- `include`: Array of glob patterns for files to include
- `exclude`: Array of glob patterns for files to exclude

### Ignoring Files with `.alignignore`

Create a `.alignignore` file in your project root to exclude files from validation:

```
# Comments start with #
**/generated/**
**/.vscode/**
**/legacy-code/**
temp.ts
```

The `.alignignore` file uses glob patterns similar to `.gitignore` and takes precedence over the `exclude` patterns in your config file.

### Framework Versions

Specify target framework versions:

```js
frameworks: {
  react: '19.0.0',
  nextjs: '15.0.0',
  typescript: '5.0.0',
  tailwind: '4.0.0',
}
```

### Testing Configuration

```js
testing: {
  framework: 'vitest', // or 'jest', 'testing-library'
  coverage: 80, // Minimum coverage threshold
  includeA11y: true, // Include accessibility tests
  testFilePattern: '__tests__/{name}.test.tsx', // Pattern for test files
}
```

### Healing Options

```js
healing: {
  migrateLegacyCode: true, // Attempt to migrate legacy code patterns
  generateMissingTests: true, // Generate tests for components without tests
  updateDependencies: true, // Update package.json dependencies
  keepOriginalFiles: false, // Keep original files as backups
  maxFixes: 50, // Maximum number of fixes to apply at once
}
```

### Architecture Validation

```js
architecture: {
  maxDirectoryDepth: 2, // Maximum nesting level for directories
  enforceKebabCase: true, // Enforce kebab-case for file names
  enforcePascalCase: true, // Enforce PascalCase for component names
  requireBarrelExports: true, // Require index.ts barrel files
  strictTypeLocation: true, // Types should be in dedicated files/directories
}
```

### Custom Rules

You can customize specific rule severity:

```js
rules: {
  'REACT19_MISSING_USE_CLIENT': 'error',
  'NEXTJS15_USING_PAGES_ROUTER': 'error',
  'TS5_MISSING_PROPS_INTERFACE': 'error',
  'TAILWIND4_UNORGANIZED_CLASSES': 'warning',
  'VITEST_MISSING_TESTS': 'warning',
  'ARCH_EXCESSIVE_NESTING': 'error',
}
```

## CLI Commands

### Analyze Project

```bash
npx stack-align analyze [options]
```

Options:
- `-d, --dir <directory>`: Project directory (default: current directory)
- `--strict`: Enable strict validation mode
- `--report <format>`: Report format (console, json, html)
- `--save <filename>`: Save report to file
- `--focus <area>`: Focus on specific area (react, nextjs, typescript, tailwind, tests)
- `--config <path>`: Path to configuration file
- `--summary`: Show summary of rule coverage instead of detailed report

### Heal Project

```bash
npx stack-align heal [options]
```

Options:
- `-d, --dir <directory>`: Project directory (default: current directory)
- `--dry-run`: Show changes without applying them
- `--max-fix <number>`: Maximum number of fixes to apply (default: unlimited)
- `--report <filename>`: Use existing analysis report
- `--filter <area>`: Only heal specific areas
- `--component <name>`: Only heal specific component
- `--generate-tests`: Generate tests for fixed components
- `--best-practices`: Include TypeScript best practices analysis
- `--config <path>`: Path to configuration file

### Generate Tests

```bash
npx stack-align test:generate [options]
```

Options:
- `-d, --dir <directory>`: Project directory (default: current directory)
- `--coverage <threshold>`: Set coverage threshold (default: '80')
- `--a11y`: Include accessibility tests
- `--component <name>`: Generate tests for specific component
- `--filter <type>`: Filter by type (components, hooks, utils)
- `--dry-run`: Show which tests would be generated
- `--overwrite`: Overwrite existing test files
- `--config <path>`: Path to configuration file

## Framework-Specific Commands

For specific frameworks, you can use:

```bash
npx stack-align heal:react
npx stack-align heal:nextjs
npx stack-align heal:typescript
npx stack-align heal:tailwind
npx stack-align heal:testing
npx stack-align typescript:best-practices
```

## Advanced Usage

### Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Check tech stack alignment
  run: npx stack-align analyze --strict --report html --save report.html

- name: Upload Report
  uses: actions/upload-artifact@v2
  with:
    name: tech-stack-alignment-report
    path: report.html
```

### Pre-commit Hook

Add to your package.json:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npx stack-align analyze --focus typescript"
    }
  }
}
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on how to contribute to this project.