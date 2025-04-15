"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVitestImplementation = validateVitestImplementation;
const path = __importStar(require("path"));
const fs_1 = require("../utils/fs");
/**
 * Validates Vitest implementation in a project
 */
async function validateVitestImplementation(context) {
    const issues = [];
    console.log('Validating Vitest implementation...');
    // Check for Vitest configuration
    const configIssues = await validateVitestConfig(context);
    issues.push(...configIssues);
    // Check for test coverage
    const coverageIssues = await validateTestCoverage(context);
    issues.push(...coverageIssues);
    // Check for component tests
    const componentTestIssues = await validateComponentTests(context);
    issues.push(...componentTestIssues);
    // Check for hook tests
    const hookTestIssues = await validateHookTests(context);
    issues.push(...hookTestIssues);
    // Check for utility tests
    const utilityTestIssues = await validateUtilityTests(context);
    issues.push(...utilityTestIssues);
    // Check for test utilities
    const testUtilIssues = await validateTestUtils(context);
    issues.push(...testUtilIssues);
    return {
        valid: issues.length === 0,
        issues,
    };
}
/**
 * Validates Vitest configuration
 */
async function validateVitestConfig(context) {
    var _a, _b;
    const issues = [];
    console.log('Checking Vitest configuration...');
    // Check for vitest.config.ts
    const vitestConfigPath = path.join(context.rootDir, 'vitest.config.ts');
    const vitestConfigExists = await (0, fs_1.fileExists)(vitestConfigPath);
    if (!vitestConfigExists) {
        // Check for vitest configuration in vite.config.ts
        const viteConfigPath = path.join(context.rootDir, 'vite.config.ts');
        const viteConfigExists = await (0, fs_1.fileExists)(viteConfigPath);
        if (viteConfigExists) {
            const viteConfig = await (0, fs_1.parseFile)(viteConfigPath);
            if (!viteConfig.content.includes('test:') && !viteConfig.content.includes('vitest')) {
                issues.push({
                    type: 'error',
                    message: 'Missing Vitest configuration in vite.config.ts',
                    filePath: viteConfigPath,
                    line: 0,
                    code: 'VITEST_MISSING_CONFIG_IN_VITE',
                    framework: 'vitest',
                    fix: {
                        type: 'manual',
                        description: 'Add Vitest configuration to vite.config.ts',
                        steps: [
                            "Import Vitest: import { defineConfig } from 'vitest/config';",
                            'Add test configuration in defineConfig: test: { environment: "jsdom", globals: true, ... }',
                        ]
                    },
                    documentation: 'https://vitest.dev/config/',
                });
            }
        }
        else {
            issues.push({
                type: 'error',
                message: 'Missing vitest.config.ts file',
                filePath: context.rootDir,
                line: 0,
                code: 'VITEST_MISSING_CONFIG',
                framework: 'vitest',
                fix: {
                    type: 'create_file',
                    path: vitestConfigPath,
                    content: `
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.config.{js,ts}', '**/*.d.ts'],
    },
    include: ['**/*.test.{js,jsx,ts,tsx}'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
        `.trim(),
                },
                documentation: 'https://vitest.dev/config/',
            });
        }
    }
    // Check for package.json test scripts
    const packageJsonPath = path.join(context.rootDir, 'package.json');
    const packageJsonExists = await (0, fs_1.fileExists)(packageJsonPath);
    if (packageJsonExists) {
        const packageJson = await (0, fs_1.readJsonFile)(packageJsonPath);
        if (packageJson && (!packageJson.scripts || !packageJson.scripts.test)) {
            issues.push({
                type: 'warning',
                message: 'Missing test script in package.json',
                filePath: packageJsonPath,
                line: 0,
                code: 'VITEST_MISSING_TEST_SCRIPT',
                framework: 'vitest',
                fix: {
                    type: 'update_json',
                    path: packageJsonPath,
                    operations: [
                        {
                            path: 'scripts.test',
                            value: 'vitest run',
                        },
                        {
                            path: 'scripts.test:watch',
                            value: 'vitest',
                        },
                        {
                            path: 'scripts.test:coverage',
                            value: 'vitest run --coverage',
                        },
                        {
                            path: 'scripts.test:generate',
                            value: 'stack-align test:generate',
                        },
                    ],
                },
                documentation: 'https://vitest.dev/guide/',
            });
        }
        // Check if test:generate script exists
        if (packageJson.scripts && !packageJson.scripts['test:generate']) {
            issues.push({
                type: 'suggestion',
                message: 'Missing test generation script in package.json',
                filePath: packageJsonPath,
                line: 0,
                code: 'VITEST_MISSING_TEST_GENERATE_SCRIPT',
                framework: 'vitest',
                fix: {
                    type: 'update_json',
                    path: packageJsonPath,
                    operations: [
                        {
                            path: 'scripts.test:generate',
                            value: 'stack-align test:generate',
                        },
                    ],
                },
                documentation: 'https://vitest.dev/guide/',
            });
        }
        // Check for Vitest dependencies
        if (!((_a = packageJson.dependencies) === null || _a === void 0 ? void 0 : _a.vitest) && !((_b = packageJson.devDependencies) === null || _b === void 0 ? void 0 : _b.vitest)) {
            issues.push({
                type: 'error',
                message: 'Missing vitest dependency in package.json',
                filePath: packageJsonPath,
                line: 0,
                code: 'VITEST_MISSING_DEPENDENCY',
                framework: 'vitest',
                fix: {
                    type: 'manual',
                    description: 'Install Vitest and related dependencies',
                    steps: [
                        'npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event',
                        'Or yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event',
                    ]
                },
                documentation: 'https://vitest.dev/guide/',
            });
        }
    }
    return issues;
}
/**
 * Validates test coverage
 */
async function validateTestCoverage(context) {
    const issues = [];
    console.log('Checking test coverage configuration...');
    // Check for vitest.config.ts coverage configuration
    const vitestConfigPath = path.join(context.rootDir, 'vitest.config.ts');
    const vitestConfigExists = await (0, fs_1.fileExists)(vitestConfigPath);
    if (vitestConfigExists) {
        const vitestConfig = await (0, fs_1.parseFile)(vitestConfigPath);
        if (!vitestConfig.content.includes('coverage:') && !vitestConfig.content.includes('coverage')) {
            issues.push({
                type: 'warning',
                message: 'Missing coverage configuration in Vitest config',
                filePath: vitestConfigPath,
                line: 0,
                code: 'VITEST_MISSING_COVERAGE_CONFIG',
                framework: 'vitest',
                fix: {
                    type: 'manual',
                    description: 'Add coverage configuration to Vitest config',
                    steps: [
                        'Add coverage configuration to test object:',
                        'coverage: { provider: "v8", reporter: ["text", "json", "html"], exclude: [...] }',
                    ]
                },
                documentation: 'https://vitest.dev/guide/coverage.html',
            });
        }
    }
    // Check overall test coverage by analyzing the component, hook, and utility files vs. test files
    // Get all component files
    const componentsDir = path.join(context.rootDir, 'src', 'components');
    const hooksDir = path.join(context.rootDir, 'src', 'hooks');
    const utilsDir = path.join(context.rootDir, 'src', 'utils');
    let totalFiles = 0;
    let totalTestFiles = 0;
    // Count component files and tests
    if (await (0, fs_1.fileExists)(componentsDir)) {
        const componentFiles = await (0, fs_1.getFilesWithExtension)(componentsDir, ['.tsx', '.jsx'], true);
        const filteredComponentFiles = componentFiles.filter(file => {
            const filename = path.basename(file);
            return !filename.includes('.test.') &&
                !filename.includes('.spec.') &&
                filename !== 'index.tsx' &&
                filename !== 'index.jsx' &&
                !file.includes('__tests__');
        });
        totalFiles += filteredComponentFiles.length;
        const testFiles = await (0, fs_1.getFilesWithExtension)(componentsDir, ['.test.tsx', '.test.jsx', '.spec.tsx', '.spec.jsx'], true);
        totalTestFiles += testFiles.length;
    }
    // Count hook files and tests
    if (await (0, fs_1.fileExists)(hooksDir)) {
        const hookFiles = await (0, fs_1.getFilesWithExtension)(hooksDir, ['.ts', '.tsx'], true);
        const filteredHookFiles = hookFiles.filter(file => {
            const filename = path.basename(file);
            return !filename.includes('.test.') &&
                !filename.includes('.spec.') &&
                filename !== 'index.ts' &&
                !file.includes('__tests__');
        });
        totalFiles += filteredHookFiles.length;
        const testFiles = await (0, fs_1.getFilesWithExtension)(hooksDir, ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'], true);
        totalTestFiles += testFiles.length;
    }
    // Count util files and tests
    if (await (0, fs_1.fileExists)(utilsDir)) {
        const utilFiles = await (0, fs_1.getFilesWithExtension)(utilsDir, ['.ts', '.tsx'], true);
        const filteredUtilFiles = utilFiles.filter(file => {
            const filename = path.basename(file);
            return !filename.includes('.test.') &&
                !filename.includes('.spec.') &&
                filename !== 'index.ts' &&
                !filename.includes('test-utils') &&
                !file.includes('__tests__');
        });
        totalFiles += filteredUtilFiles.length;
        const testFiles = await (0, fs_1.getFilesWithExtension)(utilsDir, ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'], true);
        totalTestFiles += testFiles.length;
    }
    // If we have files but few tests, suggest using the test generator
    if (totalFiles > 0) {
        const coverage = Math.round((totalTestFiles / totalFiles) * 100);
        if (coverage < 60) {
            issues.push({
                type: 'warning',
                message: `Low test coverage: only ${coverage}% of files have tests (${totalTestFiles}/${totalFiles})`,
                filePath: context.rootDir,
                line: 0,
                code: 'VITEST_LOW_TEST_COVERAGE',
                framework: 'vitest',
                fix: {
                    type: 'manual',
                    description: 'Generate tests using the context-aware test generator',
                    steps: [
                        'Run: npx stack-align test:generate',
                        'This will analyze your components, hooks, and utilities and generate appropriate tests',
                        'You can filter specific types with: npx stack-align test:generate --filter components'
                    ]
                },
                documentation: 'https://vitest.dev/guide/coverage.html',
            });
        }
    }
    return issues;
}
/**
 * Validates component tests
 */
async function validateComponentTests(context) {
    const issues = [];
    console.log('Checking component tests...');
    // Get all component files
    const componentsDir = path.join(context.rootDir, 'src', 'components');
    const componentExists = await (0, fs_1.fileExists)(componentsDir);
    if (!componentExists) {
        return issues; // Skip if components directory doesn't exist
    }
    const componentFiles = await (0, fs_1.getFilesWithExtension)(componentsDir, ['.tsx', '.jsx']);
    const filteredComponentFiles = componentFiles.filter(file => !file.includes('.test.') &&
        !file.includes('.spec.') &&
        !file.endsWith('.d.ts') &&
        !path.basename(file).startsWith('index.'));
    // Check for missing tests
    for (const componentPath of filteredComponentFiles) {
        const componentName = path.basename(componentPath).split('.')[0];
        const componentDir = path.dirname(componentPath);
        // Check for test file in __tests__ directory
        const testDir = path.join(componentDir, '__tests__');
        const testPath = path.join(testDir, `${componentName}.test.tsx`);
        const altTestPath = path.join(componentDir, `${componentName}.test.tsx`);
        const testExists = await (0, fs_1.fileExists)(testPath) || await (0, fs_1.fileExists)(altTestPath);
        if (!testExists) {
            issues.push({
                type: 'warning',
                message: `Missing test for component: ${componentName}`,
                filePath: componentPath,
                line: 0,
                code: 'VITEST_MISSING_COMPONENT_TEST',
                framework: 'vitest',
                fix: {
                    type: 'manual',
                    description: 'Create a test file for the component',
                    steps: [
                        `Use the built-in test generator: npx stack-align test:generate --component ${componentName}`,
                        'Or manually create a test file:',
                        `mkdir -p ${testDir}`,
                        `Create test file: ${componentName}.test.tsx`,
                    ]
                },
                documentation: 'https://vitest.dev/guide/testing-types.html#component-testing',
            });
        }
        else {
            // Check test quality if test exists
            const testFile = await (0, fs_1.fileExists)(testPath) ? testPath : altTestPath;
            const testContent = await (0, fs_1.parseFile)(testFile);
            // Check for basic assertions
            if (!testContent.content.includes('expect(') || !testContent.content.includes('render(')) {
                issues.push({
                    type: 'suggestion',
                    message: `Test for ${componentName} may be incomplete (missing assertions)`,
                    filePath: testFile,
                    line: 0,
                    code: 'VITEST_INCOMPLETE_TEST',
                    framework: 'vitest',
                    fix: {
                        type: 'manual',
                        description: 'Improve component test',
                        steps: [
                            'Add proper assertions to test behavior',
                            'Include render tests, prop tests, and event tests',
                        ]
                    },
                    documentation: 'https://vitest.dev/api/expect.html',
                });
            }
            // Check for user event testing in interactive components
            const componentContent = await (0, fs_1.parseFile)(componentPath);
            if ((componentContent.content.includes('onClick=') || componentContent.content.includes('onChange=')) &&
                !testContent.content.includes('userEvent') && !testContent.content.includes('fireEvent')) {
                issues.push({
                    type: 'suggestion',
                    message: `Interactive component ${componentName} should have event tests`,
                    filePath: testFile,
                    line: 0,
                    code: 'VITEST_MISSING_EVENT_TESTS',
                    framework: 'vitest',
                    fix: {
                        type: 'manual',
                        description: 'Add event testing',
                        steps: [
                            "Import user event: import userEvent from '@testing-library/user-event';",
                            'Add event tests: await user.click(button); expect(...);',
                        ]
                    },
                    documentation: 'https://testing-library.com/docs/user-event/intro',
                });
            }
        }
    }
    return issues;
}
/**
 * Validates hook tests
 */
async function validateHookTests(context) {
    const issues = [];
    console.log('Checking hook tests...');
    // Get all hook files
    const hooksDir = path.join(context.rootDir, 'src', 'hooks');
    const hooksExist = await (0, fs_1.fileExists)(hooksDir);
    if (!hooksExist) {
        return issues; // Skip if hooks directory doesn't exist
    }
    const hookFiles = await (0, fs_1.getFilesWithExtension)(hooksDir, ['.ts', '.tsx']);
    const filteredHookFiles = hookFiles.filter(file => !file.includes('.test.') &&
        !file.includes('.spec.') &&
        !file.endsWith('.d.ts') &&
        !path.basename(file).startsWith('index.'));
    // Check for missing tests
    for (const hookPath of filteredHookFiles) {
        const hookName = path.basename(hookPath).split('.')[0];
        const hookDir = path.dirname(hookPath);
        // Check for test file in __tests__ directory
        const testDir = path.join(hookDir, '__tests__');
        const testPath = path.join(testDir, `${hookName}.test.ts`);
        const altTestPath = path.join(hookDir, `${hookName}.test.ts`);
        const testExists = await (0, fs_1.fileExists)(testPath) || await (0, fs_1.fileExists)(altTestPath);
        if (!testExists) {
            issues.push({
                type: 'warning',
                message: `Missing test for hook: ${hookName}`,
                filePath: hookPath,
                line: 0,
                code: 'VITEST_MISSING_HOOK_TEST',
                framework: 'vitest',
                fix: {
                    type: 'manual',
                    description: 'Create a test file for the hook',
                    steps: [
                        `Use the built-in test generator: npx stack-align test:generate --filter hooks --component ${hookName}`,
                        'Or manually create a test file:',
                        `mkdir -p ${testDir}`,
                        `Create test file: ${hookName}.test.ts`,
                        'Use renderHook to test hook behavior',
                    ]
                },
                documentation: 'https://testing-library.com/docs/react-testing-library/api/#renderhook',
            });
        }
        else {
            // Check test quality if test exists
            const testFile = await (0, fs_1.fileExists)(testPath) ? testPath : altTestPath;
            const testContent = await (0, fs_1.parseFile)(testFile);
            // Check for renderHook usage
            if (!testContent.content.includes('renderHook(')) {
                issues.push({
                    type: 'suggestion',
                    message: `Test for ${hookName} should use renderHook`,
                    filePath: testFile,
                    line: 0,
                    code: 'VITEST_MISSING_RENDERHOOK',
                    framework: 'vitest',
                    fix: {
                        type: 'manual',
                        description: 'Use renderHook for testing hooks',
                        steps: [
                            "Import renderHook: import { renderHook } from '@testing-library/react';",
                            'Test using: const { result } = renderHook(() => useMyHook(args));',
                        ]
                    },
                    documentation: 'https://testing-library.com/docs/react-testing-library/api/#renderhook',
                });
            }
        }
    }
    return issues;
}
/**
 * Validates utility tests
 */
async function validateUtilityTests(context) {
    const issues = [];
    console.log('Checking utility tests...');
    // Get all utility files
    const utilsDir = path.join(context.rootDir, 'src', 'utils');
    const utilsExist = await (0, fs_1.fileExists)(utilsDir);
    if (!utilsExist) {
        return issues; // Skip if utils directory doesn't exist
    }
    const utilFiles = await (0, fs_1.getFilesWithExtension)(utilsDir, ['.ts', '.tsx']);
    const filteredUtilFiles = utilFiles.filter(file => !file.includes('.test.') &&
        !file.includes('.spec.') &&
        !file.endsWith('.d.ts') &&
        !path.basename(file).startsWith('index.'));
    // Check for missing tests
    for (const utilPath of filteredUtilFiles) {
        const utilName = path.basename(utilPath).split('.')[0];
        const utilDir = path.dirname(utilPath);
        // Check for test file in __tests__ directory
        const testDir = path.join(utilDir, '__tests__');
        const testPath = path.join(testDir, `${utilName}.test.ts`);
        const altTestPath = path.join(utilDir, `${utilName}.test.ts`);
        const testExists = await (0, fs_1.fileExists)(testPath) || await (0, fs_1.fileExists)(altTestPath);
        if (!testExists) {
            issues.push({
                type: 'warning',
                message: `Missing test for utility: ${utilName}`,
                filePath: utilPath,
                line: 0,
                code: 'VITEST_MISSING_UTILITY_TEST',
                framework: 'vitest',
                fix: {
                    type: 'manual',
                    description: 'Create a test file for the utility',
                    steps: [
                        `Use the built-in test generator: npx stack-align test:generate --filter utils --component ${utilName}`,
                        'Or manually create a test file:',
                        `mkdir -p ${testDir}`,
                        `Create test file: ${utilName}.test.ts`,
                        'Include tests for all exported functions',
                    ]
                },
                documentation: 'https://vitest.dev/guide/',
            });
        }
    }
    return issues;
}
/**
 * Validates test utilities
 */
async function validateTestUtils(context) {
    const issues = [];
    console.log('Checking test utilities...');
    // Check for test setup file
    const setupTestPath = path.join(context.rootDir, 'src', 'setupTests.ts');
    const setupTestExists = await (0, fs_1.fileExists)(setupTestPath);
    if (!setupTestExists) {
        issues.push({
            type: 'suggestion',
            message: 'Missing setupTests.ts file for test configuration',
            filePath: path.join(context.rootDir, 'src'),
            line: 0,
            code: 'VITEST_MISSING_SETUP',
            framework: 'vitest',
            fix: {
                type: 'create_file',
                path: setupTestPath,
                content: `
import '@testing-library/jest-dom';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
        `.trim(),
            },
            documentation: 'https://vitest.dev/guide/common-errors.html#window-document-is-not-defined',
        });
    }
    // Check for test utilities file
    const testUtilsPath = path.join(context.rootDir, 'src', 'utils', 'test-utils.ts');
    const testUtilsExists = await (0, fs_1.fileExists)(testUtilsPath);
    if (!testUtilsExists) {
        issues.push({
            type: 'suggestion',
            message: 'Missing test-utils.ts file for common test utilities',
            filePath: path.join(context.rootDir, 'src', 'utils'),
            line: 0,
            code: 'VITEST_MISSING_TEST_UTILS',
            framework: 'vitest',
            fix: {
                type: 'create_file',
                path: testUtilsPath,
                content: `
import { vi } from 'vitest';
import { render, RenderOptions } from '@testing-library/react';
import React, { ReactElement } from 'react';

/**
 * Custom render method that includes global providers
 */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { ...options });
}

/**
 * Mocks React's use hook to return provided data
 *
 * @param data - Data to be returned by the mocked use hook
 */
export function mockReactUse<T>(data: T): void {
  vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
      ...actual,
      use: vi.fn(() => data),
    };
  });
}

/**
 * Reset all mocks
 */
export function resetAllMocks(): void {
  vi.resetAllMocks();
}

// Export everything from testing-library for convenience
export * from '@testing-library/react';
        `.trim(),
            },
            documentation: 'https://testing-library.com/docs/react-testing-library/setup',
        });
    }
    return issues;
}
