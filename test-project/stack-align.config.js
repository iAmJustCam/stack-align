/**
 * Configuration for the Tech Stack Alignment System
 */
module.exports = {
  // Strictness level
  strict: true,

  // Directories to analyze
  include: ['./src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}', '**/node_modules/**'],

  // Framework versions
  frameworks: {
    react: '19.0.0',
    nextjs: '15.0.0',
    typescript: '5.0.0',
    tailwind: '4.0.0',
  },

  // Test generation options
  testing: {
    framework: 'vitest',
    coverage: 80,
    includeA11y: true,
    testFilePattern: '__tests__/{name}.test.tsx',
  },

  // Healing options
  healing: {
    migrateLegacyCode: true,
    generateMissingTests: true,
    updateDependencies: true,
    keepOriginalFiles: false,
  },

  // Architecture validation
  architecture: {
    maxDirectoryDepth: 2,
    enforceKebabCase: true,
    enforcePascalCase: true,
    requireBarrelExports: true,
    strictTypeLocation: true,
  },

  // Custom rules
  rules: {
    // Framework-specific rules can be customized here
    'REACT19_MISSING_USE_CLIENT': 'error',
    'NEXTJS15_USING_PAGES_ROUTER': 'error',
    'TS5_MISSING_PROPS_INTERFACE': 'error',
    'TAILWIND4_UNORGANIZED_CLASSES': 'warning',
    'VITEST_MISSING_TESTS': 'warning',
    'ARCH_EXCESSIVE_NESTING': 'error',
  },
};