// src/validators/tailwindv4-validator.ts
import type { ProjectContext, ValidationResult, ValidationIssue } from '../types';
import path from 'path';
import fs from 'fs';
import { scanProject } from '../utils/project-scanner';
import { Node, SyntaxKind } from 'ts-morph';

/**
 * Validates Tailwind v4 implementation in a project
 */
export async function validateTailwindV4Implementation(
  context: ProjectContext
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  console.log('Validating Tailwind v4 implementation...');

  // Check tailwind configuration
  const configIssues = await validateTailwindConfig(context);
  issues.push(...configIssues);

  // Check for CSS cascade layers
  const cascadeLayersIssues = await validateCascadeLayers(context);
  issues.push(...cascadeLayersIssues);

  // Validate class usage in components
  const classUsageIssues = await validateClassUsage(context);
  issues.push(...classUsageIssues);

  // Check for proper dark mode configuration
  const darkModeIssues = await validateDarkMode(context);
  issues.push(...darkModeIssues);

  // Check for consistent color usage
  const colorIssues = await validateColorUsage(context);
  issues.push(...colorIssues);

  // Check for utility helper functions
  const utilityHelperIssues = await validateUtilityHelpers(context);
  issues.push(...utilityHelperIssues);
  
  // Check for logical properties
  const logicalPropertyIssues = await validateLogicalProperties(context);
  issues.push(...logicalPropertyIssues);
  
  // Check for custom plugin migration
  const customPluginIssues = await validateCustomPluginMigration(context);
  issues.push(...customPluginIssues);
  
  // Check for deprecated utilities
  const deprecatedUtilityIssues = await validateDeprecatedUtilities(context);
  issues.push(...deprecatedUtilityIssues);
  
  // Check for inline styles that should be Tailwind classes
  const inlineStyleIssues = await validateInlineStylesToTailwind(context);
  issues.push(...inlineStyleIssues);

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Validates tailwind.config.js
 */
async function validateTailwindConfig(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking Tailwind configuration...');

  const tailwindConfigPath = path.join(context.rootDir, 'tailwind.config.js');
  const tailwindConfigExists = fs.existsSync(tailwindConfigPath);

  if (!tailwindConfigExists) {
    issues.push({
      type: 'error',
      message: 'Missing tailwind.config.js file',
      filePath: context.rootDir,
      line: 0,
      code: 'TAILWIND4_MISSING_CONFIG',
      framework: 'tailwind',
      fix: {
        type: 'create_file',
        path: tailwindConfigPath,
        content: `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Your custom colors
      },
    },
  },
  plugins: [],
};
        `.trim(),
      },
      documentation: 'https://tailwindcss.com/docs/configuration',
    });

    return issues;
  }

  // Analyze Tailwind config
  const hasContentConfig = await checkTailwindConfigForContent(tailwindConfigPath);
  const hasThemeExtend = await checkTailwindConfigForThemeExtend(tailwindConfigPath);
  const hasRecommendedPlugins = await checkTailwindConfigForPlugins(tailwindConfigPath);
  const hasDarkModeConfig = await checkTailwindConfigForDarkMode(tailwindConfigPath);
  const overridesDefaultColors = await checkTailwindConfigForColorOverrides(tailwindConfigPath);

  // Check for content configuration
  if (!hasContentConfig) {
    issues.push({
      type: 'error',
      message: 'Tailwind config missing content configuration',
      filePath: tailwindConfigPath,
      line: 0,
      code: 'TAILWIND4_MISSING_CONTENT_CONFIG',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Add content configuration',
        steps: [
          'Add content array: content: [\'./src/**/*.{js,ts,jsx,tsx,mdx}\']',
        ]
      },
      documentation: 'https://tailwindcss.com/docs/content-configuration',
    });
  }

  // Check for proper plugins
  if (!hasRecommendedPlugins) {
    issues.push({
      type: 'suggestion',
      message: 'Consider adding recommended Tailwind plugins',
      filePath: tailwindConfigPath,
      line: 0,
      code: 'TAILWIND4_MISSING_PLUGINS',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Add recommended Tailwind plugins',
        steps: [
          'Install plugins: npm install @tailwindcss/forms @tailwindcss/typography',
          'Add plugins to config: plugins: [require(\'@tailwindcss/forms\'), require(\'@tailwindcss/typography\')]',
        ]
      },
      documentation: 'https://tailwindcss.com/docs/plugins',
    });
  }

  // Check for proper theme configuration
  if (!hasThemeExtend) {
    issues.push({
      type: 'warning',
      message: 'Use theme.extend instead of overriding the entire theme',
      filePath: tailwindConfigPath,
      line: 0,
      code: 'TAILWIND4_THEME_OVERRIDE',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Use theme.extend for customizations',
        steps: [
          'Move theme customizations to theme.extend to avoid overriding default theme',
        ]
      },
      documentation: 'https://tailwindcss.com/docs/theme#extending-the-default-theme',
    });
  }

  // Check dark mode configuration
  if (!hasDarkModeConfig) {
    issues.push({
      type: 'suggestion',
      message: 'Consider configuring dark mode in Tailwind config',
      filePath: tailwindConfigPath,
      line: 0,
      code: 'TAILWIND4_MISSING_DARK_MODE',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Add dark mode configuration',
        steps: [
          'Add darkMode: "class" to use class-based dark mode',
          'Or use darkMode: "media" to use prefers-color-scheme',
        ]
      },
      documentation: 'https://tailwindcss.com/docs/dark-mode',
    });
  }

  // Check if using extended colors vs overriding
  if (overridesDefaultColors) {
    issues.push({
      type: 'warning',
      message: 'Overriding default colors instead of extending them',
      filePath: tailwindConfigPath,
      line: 0,
      code: 'TAILWIND4_COLOR_OVERRIDE',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Extend colors instead of overriding',
        steps: [
          'Move colors from theme.colors to theme.extend.colors',
          'This preserves default color utilities while adding custom ones',
        ]
      },
      documentation: 'https://tailwindcss.com/docs/customizing-colors',
    });
  }

  return issues;
}

/**
 * Check if Tailwind config has content configuration
 */
async function checkTailwindConfigForContent(configPath: string): Promise<boolean> {
  const content = await fs.promises.readFile(configPath, 'utf8');
  return content.includes('content:') || content.includes('content :');
}

/**
 * Check if Tailwind config has theme.extend
 */
async function checkTailwindConfigForThemeExtend(configPath: string): Promise<boolean> {
  const content = await fs.promises.readFile(configPath, 'utf8');
  return content.includes('theme: {') && content.includes('extend: {');
}

/**
 * Check if Tailwind config has recommended plugins
 */
async function checkTailwindConfigForPlugins(configPath: string): Promise<boolean> {
  const content = await fs.promises.readFile(configPath, 'utf8');
  return (content.includes('@tailwindcss/forms') || content.includes('@tailwindcss/typography'));
}

/**
 * Check if Tailwind config has dark mode configuration
 */
async function checkTailwindConfigForDarkMode(configPath: string): Promise<boolean> {
  const content = await fs.promises.readFile(configPath, 'utf8');
  return content.includes('darkMode:') || content.includes('darkMode :');
}

/**
 * Check if Tailwind config overrides default colors
 */
async function checkTailwindConfigForColorOverrides(configPath: string): Promise<boolean> {
  const content = await fs.promises.readFile(configPath, 'utf8');
  return content.includes('theme: {') && 
         content.includes('colors: {') && 
         !content.includes('extend: {') && 
         !content.includes('colors: {');
}

/**
 * Validates CSS cascade layers
 */
async function validateCascadeLayers(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking CSS cascade layers...');

  // Check for globals.css with Tailwind imports
  const globalCssPath = path.join(context.rootDir, 'src', 'app', 'globals.css');
  const globalCssExists = fs.existsSync(globalCssPath);

  if (!globalCssExists) {
    const srcGlobalCssPath = path.join(context.rootDir, 'src', 'styles', 'globals.css');
    const srcGlobalCssExists = fs.existsSync(srcGlobalCssPath);

    if (srcGlobalCssExists) {
      // Check src/styles/globals.css
      await checkCascadeLayersInFile(srcGlobalCssPath, issues);
    }
  } else {
    // Check src/app/globals.css
    await checkCascadeLayersInFile(globalCssPath, issues);
  }

  return issues;
}

/**
 * Checks for cascade layers in a CSS file
 */
async function checkCascadeLayersInFile(filePath: string, issues: ValidationIssue[]): Promise<void> {
  const content = await fs.promises.readFile(filePath, 'utf8');

  // Check for @tailwind directives
  if (content.includes('@tailwind') && !content.includes('@layer')) {
    issues.push({
      type: 'error',
      message: 'CSS cascade layers not being used with Tailwind v4',
      filePath,
      line: 0,
      code: 'TAILWIND4_MISSING_CASCADE_LAYERS',
      framework: 'tailwind',
      fix: {
        type: 'complex',
        transformer: 'addCascadeLayers',
      },
      documentation: 'https://tailwindcss.com/docs/adding-custom-styles#using-css-cascade-layers',
    });
  }

  // Check for custom styles without layers
  if (content.includes('.') && content.includes('{') && !content.includes('@layer')) {
    issues.push({
      type: 'warning',
      message: 'Custom CSS should use @layer to integrate with Tailwind',
      filePath,
      line: 0,
      code: 'TAILWIND4_CUSTOM_CSS_WITHOUT_LAYERS',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Wrap custom CSS in appropriate layers',
        steps: [
          'Wrap component styles in @layer components { ... }',
          'Wrap utility styles in @layer utilities { ... }',
          'Wrap base styles in @layer base { ... }',
        ]
      },
      documentation: 'https://tailwindcss.com/docs/adding-custom-styles#using-css-cascade-layers',
    });
  }
}

/**
 * Validates class usage in components
 */
async function validateClassUsage(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking Tailwind class usage in components...');

  // Scan project to get component files
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  // Check for cn utility function
  const cnUtilPath = path.join(context.rootDir, 'src', 'utils', 'cn.ts');
  const cnUtilExists = fs.existsSync(cnUtilPath);

  // Validate class usage in each component
  for (const filePath of componentFiles) {
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Analyze class usage in the component
    const classAnalysis = analyzeClassUsage(sourceFile);

    // Skip files without classes
    if (!classAnalysis.hasClasses) {
      continue;
    }

    // Check for string concatenation in className
    if (classAnalysis.usesStringConcatenation && !sourceFile.getFullText().includes('clsx') && !sourceFile.getFullText().includes('cn(')) {
      issues.push({
        type: 'warning',
        message: 'Use cn() or clsx() instead of string concatenation for className',
        filePath,
        line: classAnalysis.stringConcatLine || 0,
        code: 'TAILWIND4_STRING_CONCATENATION',
        framework: 'tailwind',
        fix: {
          type: 'complex',
          transformer: 'replaceStringConcatWithCn',
          context: {
            line: classAnalysis.stringConcatLine
          }
        },
        documentation: 'https://tailwindcss.com/docs/content-configuration#dynamic-class-names',
      });
    }

    // Check for template literals without helper function
    if (classAnalysis.usesTemplateLiterals && !sourceFile.getFullText().includes('clsx') && !sourceFile.getFullText().includes('cn(')) {
      issues.push({
        type: 'warning',
        message: 'Use cn() or clsx() instead of template literals for className',
        filePath,
        line: classAnalysis.templateLiteralLine || 0,
        code: 'TAILWIND4_TEMPLATE_LITERALS',
        framework: 'tailwind',
        fix: {
          type: 'complex',
          transformer: 'replaceTemplateLiteralWithCn',
          context: {
            line: classAnalysis.templateLiteralLine
          }
        },
        documentation: 'https://tailwindcss.com/docs/content-configuration#dynamic-class-names',
      });
    }

    // Check for long class strings without organization
    if (classAnalysis.hasLongClassString) {
      issues.push({
        type: 'suggestion',
        message: 'Consider organizing long className strings for readability',
        filePath,
        line: classAnalysis.longClassStringLine || 0,
        code: 'TAILWIND4_UNORGANIZED_CLASSES',
        framework: 'tailwind',
        fix: {
          type: 'complex',
          transformer: 'organizeClassNames',
          context: {
            line: classAnalysis.longClassStringLine,
            classes: classAnalysis.longClassString
          }
        },
        documentation: 'https://tailwindcss.com/docs/editor-setup',
      });
    }

    // Check for inline styles that could be Tailwind classes
    if (classAnalysis.hasInlineStyles) {
      issues.push({
        type: 'warning',
        message: 'Consider using Tailwind classes instead of inline styles',
        filePath,
        line: classAnalysis.inlineStyleLine || 0,
        code: 'TAILWIND4_INLINE_STYLES',
        framework: 'tailwind',
        fix: {
          type: 'complex',
          transformer: 'convertInlineStylesToTailwind',
          context: {
            line: classAnalysis.inlineStyleLine
          }
        },
        documentation: 'https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values',
      });
    }

    // Check for use of cn() utility
    if ((classAnalysis.usesConditionalClasses || classAnalysis.usesTemplateLiterals) &&
        !sourceFile.getFullText().includes('clsx') && !sourceFile.getFullText().includes('cn(') && cnUtilExists) {
      issues.push({
        type: 'suggestion',
        message: 'Use the cn() utility for conditional class names',
        filePath,
        line: classAnalysis.conditionalClassLine || 0,
        code: 'TAILWIND4_MISSING_CN_UTIL',
        framework: 'tailwind',
        fix: {
          type: 'complex',
          transformer: 'importAndUseCnUtility',
          context: {
            line: classAnalysis.conditionalClassLine
          }
        },
        documentation: 'https://tailwindcss.com/docs/content-configuration#dynamic-class-names',
      });
    }
  }

  return issues;
}

/**
 * Analyze class usage in a component
 */
function analyzeClassUsage(sourceFile: any) {
  const result = {
    hasClasses: false,
    usesStringConcatenation: false,
    stringConcatLine: 0,
    usesTemplateLiterals: false,
    templateLiteralLine: 0,
    hasLongClassString: false,
    longClassStringLine: 0,
    longClassString: '',
    hasInlineStyles: false,
    inlineStyleLine: 0,
    usesConditionalClasses: false,
    conditionalClassLine: 0,
    hasDarkModeClasses: false,
    hasLightModeColors: false,
    colorClasses: [] as string[],
  };

  // Find all JSX attributes
  const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute);
  
  for (const attr of jsxAttributes) {
    const nameNode = attr.getNameNode();
    const attrName = nameNode ? nameNode.getText() : '';
    
    if (attrName === 'className') {
      result.hasClasses = true;
      
      // Get the initializer
      const initializer = attr.getInitializer();
      if (!initializer) continue;
      
      // Check for string literal (regular class names)
      if (Node.isStringLiteral(initializer)) {
        const classValue = initializer.getLiteralValue();
        
        // Check for long class strings
        if (classValue.length > 50) {
          result.hasLongClassString = true;
          result.longClassStringLine = initializer.getStartLineNumber();
          result.longClassString = classValue;
        }
        
        // Check for dark mode classes
        if (classValue.includes('dark:')) {
          result.hasDarkModeClasses = true;
        }
        
        // Check for color classes
        const colorMatches = classValue.match(/(bg|text|border)-(white|black|gray|slate|blue|red|green|yellow|purple|pink|indigo)(-\d+)?/g);
        if (colorMatches) {
          result.hasLightModeColors = true;
          result.colorClasses.push(...colorMatches);
        }
      }
      // Check for JSX expressions
      else if (Node.isJsxExpression(initializer)) {
        const expression = initializer.getExpression();
        if (!expression) continue;
        
        // Check for string concatenation
        if (Node.isBinaryExpression(expression) && expression.getOperatorToken().getText() === '+') {
          result.usesStringConcatenation = true;
          result.stringConcatLine = expression.getStartLineNumber();
        }
        
        // Check for template literals
        if (Node.isTemplateExpression(expression)) {
          result.usesTemplateLiterals = true;
          result.templateLiteralLine = expression.getStartLineNumber();
        }
        
        // Check for conditional class names
        if (Node.isBinaryExpression(expression) && expression.getOperatorToken().getText() === '&&') {
          result.usesConditionalClasses = true;
          result.conditionalClassLine = expression.getStartLineNumber();
        }
      }
    }
    
    // Check for inline styles
    if (attrName === 'style') {
      const initializer = attr.getInitializer();
      if (initializer && Node.isJsxExpression(initializer)) {
        result.hasInlineStyles = true;
        result.inlineStyleLine = initializer.getStartLineNumber();
      }
    }
  }

  return result;
}

/**
 * Validates dark mode configuration and usage
 */
async function validateDarkMode(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking dark mode usage...');

  // Get all component files from scan result
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  // Track components with light mode styling but no dark mode
  let componentsWithoutDarkMode = 0;

  for (const filePath of componentFiles) {
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Analyze class usage in the component
    const classAnalysis = analyzeClassUsage(sourceFile);

    // Skip files without classes
    if (!classAnalysis.hasClasses) {
      continue;
    }

    // Check for components with bg/text colors but no dark variants
    if (classAnalysis.hasLightModeColors && !classAnalysis.hasDarkModeClasses) {
      componentsWithoutDarkMode++;

      // Only add a few issues to avoid spam
      if (componentsWithoutDarkMode <= 3) {
        issues.push({
          type: 'suggestion',
          message: 'Component has light mode styling but no dark mode variants',
          filePath,
          line: 0,
          code: 'TAILWIND4_MISSING_DARK_VARIANTS',
          framework: 'tailwind',
          fix: {
            type: 'manual',
            description: 'Add dark mode variants',
            steps: [
              'Add dark mode variants: bg-white dark:bg-gray-800',
              'For text: text-gray-900 dark:text-gray-100',
              'For borders: border-gray-200 dark:border-gray-700',
            ]
          },
          documentation: 'https://tailwindcss.com/docs/dark-mode',
        });
      }
    }
  }

  // If many components are missing dark mode, add a global recommendation
  if (componentsWithoutDarkMode > 3) {
    issues.push({
      type: 'suggestion',
      message: `${componentsWithoutDarkMode} components have light mode styling but no dark mode variants`,
      filePath: path.join(context.rootDir, 'src'),
      line: 0,
      code: 'TAILWIND4_GLOBAL_MISSING_DARK_MODE',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Add dark mode support throughout the application',
        steps: [
          'Configure darkMode in tailwind.config.js',
          'Add dark variants to color classes throughout components',
          'Consider creating a theme provider component',
        ]
      },
      documentation: 'https://tailwindcss.com/docs/dark-mode',
    });
  }

  return issues;
}

/**
 * Validates color usage across components
 */
async function validateColorUsage(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking color usage consistency...');

  // Get all component files from scan result
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  // Collect all used colors
  const colorUsage = new Map<string, number>();
  const inconsistentColors = new Set<string>();

  for (const filePath of componentFiles) {
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Analyze class usage in the component
    const classAnalysis = analyzeClassUsage(sourceFile);

    // Skip files without classes
    if (!classAnalysis.hasClasses) {
      continue;
    }

    // Analyze color usage
    for (const colorClass of classAnalysis.colorClasses) {
      // Extract color name and shade
      const match = colorClass.match(/^(bg|text|border|ring|shadow|fill|stroke)-([\w-]+)(?:-(\d+))?$/);
      if (match) {
        const [, type, color, shade] = match;

        // Skip gray and neutral colors
        if (color === 'gray' || color === 'neutral' || color === 'white' || color === 'black') {
          continue;
        }

        // Track color usage
        colorUsage.set(color, (colorUsage.get(color) || 0) + 1);

        // Check for inconsistent color shades
        if (shade && !['500', '600', '700', '900', '100', '200'].includes(shade)) {
          inconsistentColors.add(`${color}-${shade}`);
        }
      }
    }
  }

  // Check for too many different colors
  if (colorUsage.size > 5) {
    const colors = Array.from(colorUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([color, count]) => `${color} (${count} uses)`);

    issues.push({
      type: 'warning',
      message: `Using ${colorUsage.size} different colors may lead to inconsistent design`,
      filePath: path.join(context.rootDir, 'src'),
      line: 0,
      code: 'TAILWIND4_TOO_MANY_COLORS',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Standardize color usage',
        steps: [
          'Define a color palette in your design system',
          'Limit primary colors to 1-2 options',
          'Most commonly used colors: ' + colors.slice(0, 3).join(', '),
          'Consider removing: ' + colors.slice(-3).join(', ')
        ]
      },
      documentation: 'https://tailwindcss.com/docs/customizing-colors',
    });
  }

  // Check for inconsistent color shades
  if (inconsistentColors.size > 0) {
    issues.push({
      type: 'suggestion',
      message: `Using inconsistent color shades: ${Array.from(inconsistentColors).join(', ')}`,
      filePath: path.join(context.rootDir, 'src'),
      line: 0,
      code: 'TAILWIND4_INCONSISTENT_COLORS',
      framework: 'tailwind',
      fix: {
        type: 'manual',
        description: 'Standardize color shades',
        steps: [
          'Use consistent color shades throughout the application',
          'Common standards: 500 for primary, 600 for hover, 100 for light backgrounds',
        ]
      },
      documentation: 'https://tailwindcss.com/docs/customizing-colors',
    });
  }

  return issues;
}

/**
 * Validates utility helpers
 */
async function validateUtilityHelpers(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking utility helpers...');

  // Check for cn utility function
  const cnUtilPath = path.join(context.rootDir, 'src', 'utils', 'cn.ts');
  const cnUtilExists = fs.existsSync(cnUtilPath);

  if (!cnUtilExists) {
    // Check for alternative utilities
    const libDir = path.join(context.rootDir, 'src', 'lib');
    const libDirExists = fs.existsSync(libDir);

    let found = false;

    if (libDirExists) {
      const libFiles = await scanProject({...context, rootDir: libDir});
      for (const file of libFiles.allFiles) {
        const sourceFile = context.project.getSourceFile(file);
        if (!sourceFile) continue;
        
        const content = sourceFile.getFullText();
        if ((content.includes('clsx') || content.includes('classnames')) && content.includes('twMerge')) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      issues.push({
        type: 'warning',
        message: 'Missing cn() utility function for Tailwind class merging',
        filePath: path.join(context.rootDir, 'src', 'utils'),
        line: 0,
        code: 'TAILWIND4_MISSING_CN_UTILITY',
        framework: 'tailwind',
        fix: {
          type: 'create_file',
          path: cnUtilPath,
          content: `
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single className string,
 * resolving Tailwind conflicts with tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
          `.trim(),
        },
        documentation: 'https://tailwindcss.com/docs/content-configuration#dynamic-class-names',
      });
    }
  }

  // Check for package.json dependencies
  const packageJsonPath = path.join(context.rootDir, 'package.json');
  const packageJsonExists = fs.existsSync(packageJsonPath);

  if (packageJsonExists) {
    try {
      const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // Check for required dependencies
      const missingDependencies = [];

      if (!packageJson.dependencies?.['tailwind-merge'] && !packageJson.devDependencies?.['tailwind-merge']) {
        missingDependencies.push('tailwind-merge');
      }

      if (!packageJson.dependencies?.['clsx'] && !packageJson.devDependencies?.['clsx']) {
        missingDependencies.push('clsx');
      }

      if (missingDependencies.length > 0) {
        issues.push({
          type: 'warning',
          message: `Missing dependencies for Tailwind utilities: ${missingDependencies.join(', ')}`,
          filePath: packageJsonPath,
          line: 0,
          code: 'TAILWIND4_MISSING_DEPENDENCIES',
          framework: 'tailwind',
          fix: {
            type: 'manual',
            description: 'Install required dependencies',
            steps: [
              `npm install ${missingDependencies.join(' ')}`,
              'Or yarn add ' + missingDependencies.join(' '),
            ]
          },
          documentation: 'https://github.com/dcastil/tailwind-merge',
        });
      }
    } catch (error) {
      console.error('Error parsing package.json:', error);
    }
  }

  return issues;
}

/**
 * Validates logical properties
 */
async function validateLogicalProperties(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking for logical properties usage...');

  // Get all component files from scan result
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  for (const filePath of componentFiles) {
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Find JSX attributes with className
    const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)
      .filter(attr => attr.getNameNode().getText() === 'className');
    
    for (const attr of jsxAttributes) {
      const initializer = attr.getInitializer();
      if (!initializer) continue;
      
      let classValue = '';
      
      if (Node.isStringLiteral(initializer)) {
        classValue = initializer.getLiteralValue();
      } else if (Node.isJsxExpression(initializer)) {
        const expression = initializer.getExpression();
        if (Node.isStringLiteral(expression)) {
          classValue = expression.getLiteralText();
        }
      }
      
      // Define directional classes and their logical equivalents
      const directionalClasses = [
        { pattern: /\bpl-\d+\b/, logical: 'ps-', direction: 'left padding' },
        { pattern: /\bpr-\d+\b/, logical: 'pe-', direction: 'right padding' },
        { pattern: /\bml-\d+\b/, logical: 'ms-', direction: 'left margin' },
        { pattern: /\bmr-\d+\b/, logical: 'me-', direction: 'right margin' },
        { pattern: /\bborder-l-\d+\b/, logical: 'border-s-', direction: 'left border' },
        { pattern: /\bborder-r-\d+\b/, logical: 'border-e-', direction: 'right border' },
        { pattern: /\btext-left\b/, logical: 'text-start', direction: 'left text alignment' },
        { pattern: /\btext-right\b/, logical: 'text-end', direction: 'right text alignment' },
      ];
      
      // Check for directional classes that should be replaced with logical ones
      for (const { pattern, logical, direction } of directionalClasses) {
        if (pattern.test(classValue)) {
          const matches = classValue.match(pattern);
          if (matches && matches.length > 0) {
            const match = matches[0];
            const replacement = match.replace(pattern, logical + match.split('-').pop());
            
            issues.push({
              type: 'suggestion',
              message: `Use logical property "${replacement}" instead of directional "${match}"`,
              filePath,
              line: attr.getStartLineNumber(),
              code: 'TAILWIND4_DIRECTIONAL_CLASS',
              framework: 'tailwind',
              fix: {
                type: 'complex',
                transformer: 'convertToLogicalProperties',
                context: {
                  line: attr.getStartLineNumber(),
                  directionalClass: match,
                  logicalClass: replacement
                }
              },
              documentation: 'https://tailwindcss.com/docs/logical-properties',
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Validates custom plugin migration
 */
async function validateCustomPluginMigration(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking for custom plugin migration...');

  const tailwindConfigPath = path.join(context.rootDir, 'tailwind.config.js');
  const tailwindConfigExists = fs.existsSync(tailwindConfigPath);

  if (!tailwindConfigExists) {
    return issues; // Skip if config file doesn't exist
  }

  // Read the tailwind.config.js file
  try {
    const configContent = await fs.promises.readFile(tailwindConfigPath, 'utf8');
    
    // Check for custom plugins defined in the config
    if (configContent.includes('plugins:') && 
        (configContent.includes('addUtilities') || 
         configContent.includes('matchUtilities') || 
         configContent.includes('addComponents'))) {
      
      // Look for specific plugin patterns
      const utilityPattern = /addUtilities\(\s*{([^}]*)}/g;
      const componentPattern = /addComponents\(\s*{([^}]*)}/g;
      
      const utilityMatches = configContent.match(utilityPattern);
      const componentMatches = configContent.match(componentPattern);
      
      if (utilityMatches || componentMatches) {
        issues.push({
          type: 'suggestion',
          message: 'Consider migrating custom plugins to CSS @plugin directive',
          filePath: tailwindConfigPath,
          line: 0,
          code: 'TAILWIND4_CUSTOM_PLUGIN_CONFIG',
          framework: 'tailwind',
          fix: {
            type: 'manual',
            description: 'Migrate custom plugins to CSS @plugin',
            steps: [
              'Identify custom plugins in tailwind.config.js',
              'Create equivalent CSS @plugin directives in your CSS file',
              'For example:',
              `// tailwind.config.js
plugins: [
  function ({ addUtilities }) {
    addUtilities({
      '.content-auto': {
        'content-visibility': 'auto',
      }
    })
  }
]

// Convert to globals.css
@layer utilities {
  @plugin utilities {
    .content-auto {
      content-visibility: auto;
    }
  }
}`,
              'Remove custom plugins from tailwind.config.js'
            ]
          },
          documentation: 'https://tailwindcss.com/docs/plugins#css-plugins',
        });
      }
    }
  } catch (error) {
    console.error('Error reading tailwind config:', error);
  }

  return issues;
}

/**
 * Validates deprecated utilities
 */
async function validateDeprecatedUtilities(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking for deprecated utilities...');

  const tailwindConfigPath = path.join(context.rootDir, 'tailwind.config.js');
  const tailwindConfigExists = fs.existsSync(tailwindConfigPath);

  // Check for deprecated utilities in config file
  if (tailwindConfigExists) {
    try {
      const configContent = await fs.promises.readFile(tailwindConfigPath, 'utf8');
      
      // Define deprecated utilities and their replacements
      const deprecatedUtilities = [
        { name: 'target', replacement: 'targetUtil' },
        { name: 'transform', replacement: 'transformUtil' },
        { name: 'filter', replacement: 'filterUtil' },
        { name: 'isolation', replacement: 'isolationUtil' },
        { name: 'content', replacement: 'contentUtil' },
      ];
      
      for (const { name, replacement } of deprecatedUtilities) {
        if (configContent.includes(`'${name}:`) || configContent.includes(`"${name}:`)) {
          issues.push({
            type: 'warning',
            message: `Deprecated utility "${name}" detected in tailwind.config.js`,
            filePath: tailwindConfigPath,
            line: 0,
            code: 'TAILWIND4_DEPRECATED_UTILITY',
            framework: 'tailwind',
            fix: {
              type: 'complex',
              transformer: 'replaceDeprecatedUtility',
              context: {
                utilityName: name,
                replacement
              }
            },
            documentation: 'https://tailwindcss.com/docs/upgrade-guide',
          });
        }
      }
    } catch (error) {
      console.error('Error reading tailwind config:', error);
    }
  }

  // Check for deprecated utility classes in component files
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  // Define deprecated class patterns and their replacements
  const deprecatedClasses = [
    { pattern: /\bcontent-\w+\b/, replacement: 'contentUtil', description: 'content utilities' },
    { pattern: /\btransform\b/, replacement: 'transformUtil', description: 'transform utility' },
    { pattern: /\bfilter\b/, replacement: 'filterUtil', description: 'filter utility' },
    { pattern: /\bisolation-\w+\b/, replacement: 'isolationUtil', description: 'isolation utility' },
  ];

  for (const filePath of componentFiles) {
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Find JSX attributes with className
    const jsxAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)
      .filter(attr => attr.getNameNode().getText() === 'className');
    
    for (const attr of jsxAttributes) {
      const initializer = attr.getInitializer();
      if (!initializer) continue;
      
      let classValue = '';
      
      if (Node.isStringLiteral(initializer)) {
        classValue = initializer.getLiteralValue();
      } else if (Node.isJsxExpression(initializer)) {
        const expression = initializer.getExpression();
        if (Node.isStringLiteral(expression)) {
          classValue = expression.getLiteralText();
        }
      }
      
      // Check for deprecated classes
      for (const { pattern, replacement, description } of deprecatedClasses) {
        if (pattern.test(classValue)) {
          issues.push({
            type: 'warning',
            message: `Deprecated Tailwind v4 ${description} in className`,
            filePath,
            line: attr.getStartLineNumber(),
            code: 'TAILWIND4_DEPRECATED_CLASS',
            framework: 'tailwind',
            fix: {
              type: 'manual',
              description: `Update ${description} to the new syntax`,
              steps: [
                `Consult the Tailwind v4 documentation for the new ${replacement} syntax`,
                'Remove the deprecated class and replace with the new equivalent'
              ]
            },
            documentation: 'https://tailwindcss.com/docs/upgrade-guide',
          });
        }
      }
    }
  }

  return issues;
}

/**
 * Validates inline styles that should be converted to Tailwind classes
 */
async function validateInlineStylesToTailwind(context: ProjectContext): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  console.log('Checking for inline styles that should be Tailwind classes...');

  // Get all component files from scan result
  const scanResult = await scanProject(context);
  const componentFiles = scanResult.componentFiles;

  for (const filePath of componentFiles) {
    const sourceFile = context.project.getSourceFile(filePath);
    if (!sourceFile) continue;

    // Find JSX attributes with style
    const styleAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)
      .filter(attr => attr.getNameNode().getText() === 'style');
    
    for (const attr of styleAttributes) {
      const initializer = attr.getInitializer();
      if (!initializer || !Node.isJsxExpression(initializer)) continue;
      
      const expression = initializer.getExpression();
      if (!expression) continue;
      
      // For object literal styles
      if (Node.isObjectLiteralExpression(expression)) {
        const properties = expression.getProperties();
        
        // Only suggest converting if there are common properties that have Tailwind equivalents
        const convertibleProperties = properties.filter(prop => {
          if (!Node.isPropertyAssignment(prop)) return false;
          
          const propName = prop.getName();
          // Check for properties that are commonly handled by Tailwind
          return ['margin', 'padding', 'backgroundColor', 'color', 'borderRadius', 'fontSize', 
                  'fontWeight', 'display', 'flexDirection', 'alignItems', 'justifyContent',
                  'textAlign', 'width', 'height', 'maxWidth', 'maxHeight'].includes(propName);
        });
        
        if (convertibleProperties.length > 0) {
          issues.push({
            type: 'warning',
            message: 'Consider using Tailwind classes instead of inline styles',
            filePath,
            line: attr.getStartLineNumber(),
            code: 'TAILWIND4_INLINE_STYLES_TO_CLASSES',
            framework: 'tailwind',
            fix: {
              type: 'complex',
              transformer: 'convertInlineStylesToTailwind',
              context: {
                line: attr.getStartLineNumber(),
                properties: convertibleProperties.map(p => {
                  if (Node.isPropertyAssignment(p)) {
                    return {
                      name: p.getName(),
                      value: p.getInitializer()?.getText() || ''
                    };
                  }
                  return null;
                }).filter(Boolean)
              }
            },
            documentation: 'https://tailwindcss.com/docs/utility-first',
          });
        }
      }
    }
  }

  return issues;
}