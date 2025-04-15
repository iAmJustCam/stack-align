#!/usr/bin/env node
// Allow importing from this module
import chalk from 'chalk';
import { Command } from 'commander';
import figlet from 'figlet';
import fs from 'fs';
import ora from 'ora';
import path from 'path';
import { analyzeProjectTopDown } from '../core/top-down-analyzer';
import { healProject } from '../healers/healing-engine';
import { generateTests } from '../healers/test-generation-engine';
import type { AnalysisReport, HealingOptions, ProjectContext, ValidationIssue } from '../types';
import { createProjectContext } from '../utils/context';

// Create CLI program
const program = new Command();

/**
 * Displays the banner for the CLI
 */
function displayBanner(): void {
  console.log(
    chalk.cyan(
      figlet.textSync('Tech Stack Align', { horizontalLayout: 'full' })
    )
  );
  console.log(chalk.cyan('Modern stack validation & healing system - v1.0.0\n'));
}

/**
 * Loads configuration from stack-align.config.js if available
 */
function loadConfig(configPath: string = './stack-align.config.js'): any {
  const absolutePath = path.resolve(process.cwd(), configPath);

  if (fs.existsSync(absolutePath)) {
    try {
      // Using require here as this is a Node.js CLI tool
      return require(absolutePath);
    } catch (error) {
      console.warn(chalk.yellow('Failed to load configuration file, using defaults.'));
      return {};
    }
  }

  return {};
}

/**
 * Saves report to file
 */
async function saveReport(report: AnalysisReport, filePath: string): Promise<void> {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const content = JSON.stringify(report, null, 2);

  fs.writeFileSync(absolutePath, content, 'utf8');
}

/**
 * Loads report from file
 */
async function loadReport(filePath: string): Promise<AnalysisReport> {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const content = fs.readFileSync(absolutePath, 'utf8');

  return JSON.parse(content) as AnalysisReport;
}

/**
 * Creates a project context
 */
async function createContext(dir: string): Promise<ProjectContext> {
  return createProjectContext(path.resolve(process.cwd(), dir));
}

// Main CLI configuration
program
  .name('stack-align')
  .description('Tech Stack Alignment System for React 19, Next.js 15, TypeScript 5, and Tailwind v4')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .description('Analyze project against best practices')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--strict', 'Enable strict validation mode')
  .option('--report <format>', 'Report format (console, json, html)', 'console')
  .option('--save <filename>', 'Save report to file')
  .option('--focus <area>', 'Focus analysis on specific area (react, nextjs, typescript, tailwind, tests)')
  .option('--summary', 'Show summary of rule coverage instead of detailed report')
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    displayBanner();

    const config = loadConfig(options.config);
    const spinner = ora('Starting project analysis...').start();

    try {
      const report = await analyzeProjectTopDown(options.dir, {
        strict: options.strict || config.strict,
        focus: options.focus,
        config
      });

      spinner.succeed('Analysis complete!');

      // Save report if requested
      if (options.save) {
        await saveReport(report, options.save);
        console.log(chalk.green(`Report saved to ${options.save}`));
      }

      // Display report based on options
      if (options.summary) {
        displayRuleCoverageSummary(report);
      } else {
        displaySummary(report);
      }

    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Heal command
program
  .command('heal')
  .description('Fix issues in project automatically')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--dry-run', 'Show changes without applying them')
  .option('--max-fix <number>', 'Maximum number of fixes to apply (unlimited by default)', parseInt)
  .option('--report <filename>', 'Use existing analysis report')
  .option('--filter <area>', 'Only heal specific areas (react, nextjs, typescript, tailwind, tests)')
  .option('--component <name>', 'Only heal specific component')
  .option('--generate-tests', 'Generate tests for fixed components', false)
  .option('--best-practices', 'Include TypeScript best practices analysis', false)
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    displayBanner();

    const config = loadConfig(options.config);
    let report: AnalysisReport;

    // Use existing report or run analysis
    if (options.report) {
      const spinner = ora('Loading analysis report...').start();
      try {
        report = await loadReport(options.report);
        spinner.succeed('Report loaded');
      } catch (error) {
        spinner.fail('Failed to load report');
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    } else {
      const spinner = ora('Analyzing project...').start();
      try {
        report = await analyzeProjectTopDown(options.dir, {
          strict: config.strict,
          focus: options.filter,
          config
        });
        spinner.succeed('Analysis complete');
      } catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    }

    // Heal project
    const healingSpinner = ora('Healing project issues...').start();

    try {
      const context = await createContext(options.dir);

      const healingOptions: HealingOptions = {
        dryRun: options.dryRun,
        maxFix: options.maxFix,
        filter: options.filter,
        component: options.component,
        generateTests: options.generateTests,
        bestPractices: options.bestPractices,
        config
      };

      const healingReport = await healProject(context, report.results, healingOptions);

      healingSpinner.succeed('Healing complete');

      // Display healing report
      console.log('\n' + chalk.cyan('📝 Healing Report:'));

      // Display mode information
      if (options.dryRun) {
        console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes were applied'));
      }
      
      if (healingReport.stats.limitApplied) {
        console.log(chalk.yellow(`⚠️  FIX LIMIT APPLIED - Limited to ${healingReport.stats.fixLimit} fixes (${healingReport.stats.remainingIssues} issues remain)`));
      }

      // Count operations by type
      const operationsByType = healingReport.operations.reduce<Record<string, number>>((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {});

      console.log('\nOperation summary:');
      Object.entries(operationsByType).forEach(([type, count]) => {
        console.log(`  ${chalk.green('✓')} ${chalk.bold(type)}: ${count} operations`);
      });

      console.log('\nModified files:');
      const uniqueFilePaths = [...new Set(healingReport.operations
        .filter(op => op.path)
        .map(op => op.path))];

      if (uniqueFilePaths.length > 0) {
        uniqueFilePaths.forEach(path => {
          console.log(`  ${chalk.green('✓')} ${path}`);
        });
      } else {
        console.log(`  ${chalk.yellow('No files were modified')}`);
      }

      // Overall summary
      console.log('\n' + chalk.cyan('📊 Summary:'));
      console.log(`  ${chalk.bold('Total issues')}: ${healingReport.stats.totalIssues}`);
      console.log(`  ${chalk.bold('Fixed issues')}: ${healingReport.stats.fixedIssues}`);
      
      if (healingReport.stats.limitApplied) {
        console.log(`  ${chalk.bold('Remaining issues')}: ${healingReport.stats.remainingIssues}`);
      }

      console.log('\n' + chalk.green('✨ Project healing complete!'));

      if (options.generateTests) {
        console.log(chalk.cyan('\n📊 Test Generation Summary:'));
        console.log(`  ${chalk.green('✓')} Generated tests for ${uniqueFilePaths.length} components`);
      }

    } catch (error) {
      healingSpinner.fail('Healing failed');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Generate tests command
program
  .command('test:generate')
  .alias('generate-tests')
  .description('Generate context-aware Vitest tests for components, hooks, and utilities')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--coverage <threshold>', 'Set coverage threshold', '80')
  .option('--a11y', 'Include accessibility tests', false)
  .option('--component <name>', 'Generate tests for specific component')
  .option('--filter <type>', 'Filter by type (components, hooks, utils)')
  .option('--dry-run', 'Show which tests would be generated without writing files', false)
  .option('--overwrite', 'Overwrite existing test files', false)
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    displayBanner();

    const config = loadConfig(options.config);
    const spinner = ora('Setting up test generation...').start();

    try {
      const context = await createContext(options.dir);
      spinner.text = 'Analyzing project structure...';

      const testOptions = {
        coverageThreshold: parseInt(options.coverage, 10),
        includeA11y: options.a11y,
        componentName: options.component,
        filter: options.filter,
        dryRun: options.dryRun,
        overwrite: options.overwrite,
        config
      };

      spinner.text = 'Generating context-aware tests...';
      const testReport = await generateTests(context, testOptions);

      spinner.succeed('Test generation complete');

      // Display test generation report
      console.log('\n' + chalk.cyan('🧪 Context-Aware Test Generation Report:'));
      
      // Show summary
      console.log(`  ${chalk.green('✓')} Processed ${testReport.summary.total} files`);
      console.log(`  ${chalk.green('✓')} Created ${testReport.summary.created} new test files`);
      console.log(`  ${chalk.yellow('⚠')} Skipped ${testReport.summary.skipped} existing files`);
      
      // Display by file type
      console.log('\nTests by file type:');
      console.log(`  ${chalk.green('✓')} ${chalk.bold('Components')}: ${testReport.summary.componentTests}`);
      console.log(`  ${chalk.green('✓')} ${chalk.bold('Hooks')}: ${testReport.summary.hookTests}`);
      console.log(`  ${chalk.green('✓')} ${chalk.bold('Utilities')}: ${testReport.summary.utilityTests}`);
      
      // Group by operation type
      const testsByType = testReport.operations.reduce((acc: Record<string, number>, op: any) => {
        const key = `${op.type} ${op.entityKind || ''}`.trim();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      console.log('\nOperation details:');
      Object.entries(testsByType).forEach(([type, count]) => {
        const color = type.includes('error') ? chalk.red : 
                      type.includes('skip') ? chalk.yellow : 
                      type.includes('dryrun') ? chalk.blue : 
                      chalk.green;
        console.log(`  ${color('•')} ${chalk.bold(type)}: ${count}`);
      });
      
      // Show some examples of created tests
      const createdTests = testReport.operations.filter(op => op.success && op.testPath);
      if (createdTests.length > 0) {
        console.log('\nExample tests created:');
        createdTests.slice(0, Math.min(5, createdTests.length)).forEach(op => {
          console.log(`  ${chalk.green('✓')} ${path.relative(options.dir, op.testPath || '')} (${op.entityKind || 'unknown'})`);
        });
        
        if (createdTests.length > 5) {
          console.log(`  ${chalk.gray('... and')} ${createdTests.length - 5} ${chalk.gray('more')}`);
        }
      }

      console.log('\n' + chalk.green('✨ Context-aware test generation complete!'));
      
      if (options.dryRun) {
        console.log(chalk.yellow('\n⚠️  DRY RUN MODE - No files were created'));
        console.log(chalk.yellow('   Run without --dry-run to create the test files'));
      }

    } catch (error) {
      spinner.fail('Test generation failed');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Specific commands for focused healing

// React 19 healing
program
  .command('heal:react')
  .description('Fix React 19 specific issues')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--dry-run', 'Show changes without applying them')
  .option('--generate-tests', 'Generate tests for fixed components', false)
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    // Implementation that calls main heal with filter=react
    await program.parseAsync(['node', 'script.js', 'heal',
      '-d', options.dir,
      '--filter', 'react',
      options.generateTests ? '--generate-tests' : '',
      options.dryRun ? '--dry-run' : '',
      '--config', options.config
    ].filter(Boolean));
  });

// Next.js 15 healing
program
  .command('heal:nextjs')
  .description('Fix Next.js 15 specific issues')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--dry-run', 'Show changes without applying them')
  .option('--generate-tests', 'Generate tests for fixed components', false)
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    // Implementation that calls main heal with filter=nextjs
    await program.parseAsync(['node', 'script.js', 'heal',
      '-d', options.dir,
      '--filter', 'nextjs',
      options.generateTests ? '--generate-tests' : '',
      options.dryRun ? '--dry-run' : '',
      '--config', options.config
    ].filter(Boolean));
  });

// TypeScript 5 healing
program
  .command('heal:typescript')
  .description('Fix TypeScript 5 specific issues')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--dry-run', 'Show changes without applying them')
  .option('--generate-tests', 'Generate tests for fixed components', false)
  .option('--best-practices', 'Include TypeScript best practices analysis', false)
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    // Implementation that calls main heal with filter=typescript
    await program.parseAsync(['node', 'script.js', 'heal',
      '-d', options.dir,
      '--filter', 'typescript',
      options.generateTests ? '--generate-tests' : '',
      options.dryRun ? '--dry-run' : '',
      options.bestPractices ? '--best-practices' : '',
      '--config', options.config
    ].filter(Boolean));
  });

// TypeScript Best Practices
program
  .command('typescript:best-practices')
  .description('Check for TypeScript best practices based on common errors')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--fix', 'Automatically fix detected issues', false)
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    displayBanner();

    const config = loadConfig(options.config);
    const spinner = ora('Analyzing TypeScript best practices...').start();

    try {
      const context = await createContext(options.dir);
      
      // Import the validator directly to avoid circular dependencies
      const { validateTypeScriptBestPractices } = await import('../validators/typescript-best-practices-validator');
      
      const bestPracticesResults = await validateTypeScriptBestPractices(context);
      
      spinner.succeed('Analysis complete!');

      // Display results
      console.log('\n' + chalk.cyan('🛡️ TypeScript Best Practices Results:'));
      
      if (bestPracticesResults.issues.length === 0) {
        console.log(chalk.green('✨ No TypeScript best practice issues found!'));
      } else {
        console.log(chalk.yellow(`Found ${bestPracticesResults.issues.length} TypeScript best practice issues`));
        
        // Group issues by type
        const issuesByCode = bestPracticesResults.issues.reduce((acc: Record<string, ValidationIssue[]>, issue) => {
          const code = issue.code || 'other';
          acc[code] = acc[code] || [];
          acc[code].push(issue);
          return acc;
        }, {});

        // Display grouped issues
        Object.entries(issuesByCode).forEach(([code, issues]) => {
          console.log(`\n${chalk.bold(code)}: ${issues.length} issues`);
          issues.slice(0, 3).forEach(issue => {
            console.log(`  ${issue.type === 'error' ? chalk.red('✗') : chalk.yellow('⚠')} ${issue.message} (${issue.filePath}:${issue.line})`);
          });
          if (issues.length > 3) {
            console.log(chalk.gray(`  ... and ${issues.length - 3} more similar issues`));
          }
        });

        if (options.fix) {
          console.log('\n' + chalk.cyan('🔧 Fixing TypeScript best practice issues...'));
          // Implement fix logic here when available
          console.log(chalk.yellow('Automatic fixing is not yet implemented for all issues'));
          console.log(chalk.cyan('💡 See documentation in /docs/typescript-error-prevention.md for manual fixes'));
        } else {
          console.log(chalk.cyan('\n💡 Run with --fix to attempt automatic fixes'));
          console.log(chalk.cyan('📖 See documentation in /docs/typescript-error-prevention.md for details'));
        }
      }
    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      process.exit(1);
    }
  });

// Tailwind v4 healing
program
  .command('heal:tailwind')
  .description('Fix Tailwind v4 specific issues')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--dry-run', 'Show changes without applying them')
  .option('--generate-tests', 'Generate tests for fixed components', false)
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    // Implementation that calls main heal with filter=tailwind
    await program.parseAsync(['node', 'script.js', 'heal',
      '-d', options.dir,
      '--filter', 'tailwind',
      options.generateTests ? '--generate-tests' : '',
      options.dryRun ? '--dry-run' : '',
      '--config', options.config
    ].filter(Boolean));
  });

// Testing healing
program
  .command('heal:testing')
  .description('Fix testing setup and generate missing tests')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--dry-run', 'Show changes without applying them')
  .option('--coverage <threshold>', 'Set coverage threshold', '80')
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action(async (options) => {
    // Implementation that calls main heal with filter=tests and --generate-tests
    await program.parseAsync(['node', 'script.js', 'heal',
      '-d', options.dir,
      '--filter', 'tests',
      '--generate-tests',
      options.dryRun ? '--dry-run' : '',
      '--config', options.config
    ].filter(Boolean));
  });

// Display summary helper
function displaySummary(report: AnalysisReport) {
  console.log('\n' + chalk.cyan('📊 Analysis Summary:'));

  // Count issues by severity
  const errorCount = countIssuesBySeverity(report, 'error');
  const warningCount = countIssuesBySeverity(report, 'warning');
  const suggestionCount = countIssuesBySeverity(report, 'suggestion');

  console.log(`  ${chalk.red('✗')} ${chalk.bold(errorCount)} errors`);
  console.log(`  ${chalk.yellow('⚠')} ${chalk.bold(warningCount)} warnings`);
  console.log(`  ${chalk.blue('ℹ')} ${chalk.bold(suggestionCount)} suggestions`);

  // Count issues by framework
  console.log('\nIssues by framework:');
  const frameworkCounts = countIssuesByFramework(report);

  Object.entries(frameworkCounts).forEach(([framework, count]) => {
    const color = count > 0 ? chalk.yellow : chalk.green;
    console.log(`  ${color(framework)}: ${count}`);
  });

  if (errorCount + warningCount + suggestionCount === 0) {
    console.log('\n' + chalk.green('✨ No issues found! Your project is aligned with best practices.'));
  } else {
    console.log('\n' + chalk.cyan('💡 Next steps:'));
    console.log(`  Run ${chalk.bold('stack-align heal')} to automatically fix detected issues`);
    console.log(`  Or run ${chalk.bold('stack-align heal --dry-run')} to preview changes first`);
  }
}

// Helper to count issues by severity
function countIssuesBySeverity(report: AnalysisReport, severity: string): number {
  let count = 0;

  // Project issues
  count += report.results.project.issues.filter(i => i.type === severity).length;

  // Framework issues
  Object.values(report.results.frameworks).forEach(framework => {
    count += framework.issues.filter(i => i.type === severity).length;
  });

  // Component issues
  count += report.results.components.issues.filter(i => i.type === severity).length;

  // Page issues
  count += report.results.pages.issues.filter(i => i.type === severity).length;

  // Hook issues
  count += report.results.hooks.issues.filter(i => i.type === severity).length;

  // Utility issues
  count += report.results.utilities.issues.filter(i => i.type === severity).length;

  return count;
}

/**
 * Displays a summary view focused on rule coverage per framework
 */
function displayRuleCoverageSummary(report: AnalysisReport) {
  console.log('\n' + chalk.cyan('📊 Rule Coverage Summary:'));
  console.log('---------------------------------------');
  
  // Count issues and files by framework
  const issuesByFramework = countIssuesByFramework(report);
  const filesByFramework = countFilesByFramework(report);
  
  // Group issues by rule code
  const issuesByRuleCode = groupIssuesByRuleCode(report);
  
  // Prepare summary by framework
  Object.entries(issuesByFramework).forEach(([framework, count]) => {
    if (framework !== 'other' && (count > 0 || filesByFramework[framework] > 0)) {
      console.log(`\n${chalk.bold(framework.toUpperCase())}: ${count} issues in ${filesByFramework[framework]} files`);
      
      // Get rule codes for this framework
      const frameworkRules = Object.entries(issuesByRuleCode)
        .filter(([code, issues]) => issues.some(issue => issue.framework === framework))
        .map(([code, issues]) => {
          const frameworkIssues = issues.filter(issue => issue.framework === framework);
          return {
            code,
            count: frameworkIssues.length,
            errorCount: frameworkIssues.filter(i => i.type === 'error').length,
            warningCount: frameworkIssues.filter(i => i.type === 'warning').length,
            suggestionCount: frameworkIssues.filter(i => i.type === 'suggestion').length,
          };
        })
        .sort((a, b) => b.count - a.count); // Sort by count descending
      
      // Show top rules
      frameworkRules.forEach(rule => {
        let ruleStatus = '';
        if (rule.errorCount > 0) {
          ruleStatus = chalk.red('⚠️');
        } else if (rule.warningCount > 0) {
          ruleStatus = chalk.yellow('⚠️');
        } else {
          ruleStatus = chalk.blue('ℹ️');
        }
        
        console.log(`  ${ruleStatus} ${rule.code}: ${rule.count} occurrences`);
      });
    }
  });

  if (Object.values(issuesByFramework).every(count => count === 0)) {
    console.log('\n' + chalk.green('✨ No issues found! Your project is aligned with best practices.'));
  } else {
    console.log('\n' + chalk.cyan('💡 Next steps:'));
    console.log(`  Run ${chalk.bold('stack-align heal')} to automatically fix detected issues`);
    console.log(`  Or run ${chalk.bold('stack-align heal --dry-run')} to preview changes first`);
  }
}

/**
 * Groups issues by rule code (e.g., REACT19_HOOKS_DEPS)
 */
function groupIssuesByRuleCode(report: AnalysisReport): Record<string, ValidationIssue[]> {
  const result: Record<string, ValidationIssue[]> = {};
  
  function processIssues(issues: ValidationIssue[]) {
    issues.forEach(issue => {
      if (!result[issue.code]) {
        result[issue.code] = [];
      }
      result[issue.code].push(issue);
    });
  }
  
  // Process all issues
  processIssues(report.results.project.issues);
  Object.values(report.results.frameworks).forEach(framework => processIssues(framework.issues));
  processIssues(report.results.components.issues);
  processIssues(report.results.pages.issues);
  processIssues(report.results.hooks.issues);
  processIssues(report.results.utilities.issues);
  
  return result;
}

/**
 * Counts files by framework from analysis report
 */
function countFilesByFramework(report: AnalysisReport): Record<string, number> {
  // This is a simplified version - in a real implementation, you'd count actual files
  // based on the project structure and analysis
  const counts = {
    react: report.results.components.issues.length > 0 ? 
      [...new Set(report.results.components.issues.map(i => i.filePath))].length : 0,
    nextjs: report.results.frameworks.nextjs.issues.length > 0 ? 
      [...new Set(report.results.frameworks.nextjs.issues.map(i => i.filePath))].length : 0,
    typescript: report.results.frameworks.typescript.issues.length > 0 ? 
      [...new Set(report.results.frameworks.typescript.issues.map(i => i.filePath))].length : 0,
    tailwind: report.results.frameworks.tailwind.issues.length > 0 ? 
      [...new Set(report.results.frameworks.tailwind.issues.map(i => i.filePath))].length : 0,
    vitest: report.results.frameworks.vitest.issues.length > 0 ? 
      [...new Set(report.results.frameworks.vitest.issues.map(i => i.filePath))].length : 0,
    architecture: 0,
    other: 0
  };
  
  // Ensure at least 1 for frameworks that have issues
  Object.keys(counts).forEach(key => {
    if (report.results.frameworks[key as keyof typeof report.results.frameworks]?.issues.length > 0 && counts[key as keyof typeof counts] === 0) {
      counts[key as keyof typeof counts] = 1;
    }
  });
  
  return counts;
}

// Helper to count issues by framework
function countIssuesByFramework(report: AnalysisReport): Record<string, number> {
  const counts = {
    react: 0,
    nextjs: 0,
    typescript: 0,
    tailwind: 0,
    vitest: 0,
    architecture: 0,
    other: 0
  };

  // Count all issues by framework
  function addIssues(issues: ValidationIssue[]) {
    issues.forEach(issue => {
      const framework = issue.framework || 'other';
      counts[framework as keyof typeof counts] = (counts[framework as keyof typeof counts] || 0) + 1;
    });
  }

  // Project issues
  addIssues(report.results.project.issues);

  // Framework issues
  Object.values(report.results.frameworks).forEach(framework => {
    addIssues(framework.issues);
  });

  // Component issues
  addIssues(report.results.components.issues);

  // Page issues
  addIssues(report.results.pages.issues);

  // Hook issues
  addIssues(report.results.hooks.issues);

  // Utility issues
  addIssues(report.results.utilities.issues);

  return counts;
}

// Export the program for importing in other modules
export { program };

// Run the CLI if this file is executed directly
if (require.main === module) {
  program.parse(process.argv);
}
