#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.program = void 0;
// Allow importing from this module
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const figlet_1 = __importDefault(require("figlet"));
const fs_1 = __importDefault(require("fs"));
const ora_1 = __importDefault(require("ora"));
const path_1 = __importDefault(require("path"));
const top_down_analyzer_1 = require("../core/top-down-analyzer");
const healing_engine_1 = require("../healers/healing-engine");
const test_generation_engine_1 = require("../healers/test-generation-engine");
const context_1 = require("../utils/context");
// Create CLI program
const program = new commander_1.Command();
exports.program = program;
/**
 * Displays the banner for the CLI
 */
function displayBanner() {
    console.log(chalk_1.default.cyan(figlet_1.default.textSync('Tech Stack Align', { horizontalLayout: 'full' })));
    console.log(chalk_1.default.cyan('Modern stack validation & healing system - v1.0.0\n'));
}
/**
 * Loads configuration from stack-align.config.js if available
 */
function loadConfig(configPath = './stack-align.config.js') {
    const absolutePath = path_1.default.resolve(process.cwd(), configPath);
    if (fs_1.default.existsSync(absolutePath)) {
        try {
            // Using require here as this is a Node.js CLI tool
            return require(absolutePath);
        }
        catch (error) {
            console.warn(chalk_1.default.yellow('Failed to load configuration file, using defaults.'));
            return {};
        }
    }
    return {};
}
/**
 * Saves report to file
 */
async function saveReport(report, filePath) {
    const absolutePath = path_1.default.resolve(process.cwd(), filePath);
    const content = JSON.stringify(report, null, 2);
    fs_1.default.writeFileSync(absolutePath, content, 'utf8');
}
/**
 * Loads report from file
 */
async function loadReport(filePath) {
    const absolutePath = path_1.default.resolve(process.cwd(), filePath);
    const content = fs_1.default.readFileSync(absolutePath, 'utf8');
    return JSON.parse(content);
}
/**
 * Creates a project context
 */
async function createContext(dir) {
    return (0, context_1.createProjectContext)(path_1.default.resolve(process.cwd(), dir));
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
    const spinner = (0, ora_1.default)('Starting project analysis...').start();
    try {
        const report = await (0, top_down_analyzer_1.analyzeProjectTopDown)(options.dir, {
            strict: options.strict || config.strict,
            focus: options.focus,
            config
        });
        spinner.succeed('Analysis complete!');
        // Save report if requested
        if (options.save) {
            await saveReport(report, options.save);
            console.log(chalk_1.default.green(`Report saved to ${options.save}`));
        }
        // Display report based on options
        if (options.summary) {
            displayRuleCoverageSummary(report);
        }
        else {
            displaySummary(report);
        }
    }
    catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
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
    let report;
    // Use existing report or run analysis
    if (options.report) {
        const spinner = (0, ora_1.default)('Loading analysis report...').start();
        try {
            report = await loadReport(options.report);
            spinner.succeed('Report loaded');
        }
        catch (error) {
            spinner.fail('Failed to load report');
            console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    }
    else {
        const spinner = (0, ora_1.default)('Analyzing project...').start();
        try {
            report = await (0, top_down_analyzer_1.analyzeProjectTopDown)(options.dir, {
                strict: config.strict,
                focus: options.filter,
                config
            });
            spinner.succeed('Analysis complete');
        }
        catch (error) {
            spinner.fail('Analysis failed');
            console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
            process.exit(1);
        }
    }
    // Heal project
    const healingSpinner = (0, ora_1.default)('Healing project issues...').start();
    try {
        const context = await createContext(options.dir);
        const healingOptions = {
            dryRun: options.dryRun,
            maxFix: options.maxFix,
            filter: options.filter,
            component: options.component,
            generateTests: options.generateTests,
            bestPractices: options.bestPractices,
            config
        };
        const healingReport = await (0, healing_engine_1.healProject)(context, report.results, healingOptions);
        healingSpinner.succeed('Healing complete');
        // Display healing report
        console.log('\n' + chalk_1.default.cyan('📝 Healing Report:'));
        // Display mode information
        if (options.dryRun) {
            console.log(chalk_1.default.yellow('⚠️  DRY RUN MODE - No changes were applied'));
        }
        if (healingReport.stats.limitApplied) {
            console.log(chalk_1.default.yellow(`⚠️  FIX LIMIT APPLIED - Limited to ${healingReport.stats.fixLimit} fixes (${healingReport.stats.remainingIssues} issues remain)`));
        }
        // Count operations by type
        const operationsByType = healingReport.operations.reduce((acc, op) => {
            acc[op.type] = (acc[op.type] || 0) + 1;
            return acc;
        }, {});
        console.log('\nOperation summary:');
        Object.entries(operationsByType).forEach(([type, count]) => {
            console.log(`  ${chalk_1.default.green('✓')} ${chalk_1.default.bold(type)}: ${count} operations`);
        });
        console.log('\nModified files:');
        const uniqueFilePaths = [...new Set(healingReport.operations
                .filter(op => op.path)
                .map(op => op.path))];
        if (uniqueFilePaths.length > 0) {
            uniqueFilePaths.forEach(path => {
                console.log(`  ${chalk_1.default.green('✓')} ${path}`);
            });
        }
        else {
            console.log(`  ${chalk_1.default.yellow('No files were modified')}`);
        }
        // Overall summary
        console.log('\n' + chalk_1.default.cyan('📊 Summary:'));
        console.log(`  ${chalk_1.default.bold('Total issues')}: ${healingReport.stats.totalIssues}`);
        console.log(`  ${chalk_1.default.bold('Fixed issues')}: ${healingReport.stats.fixedIssues}`);
        if (healingReport.stats.limitApplied) {
            console.log(`  ${chalk_1.default.bold('Remaining issues')}: ${healingReport.stats.remainingIssues}`);
        }
        console.log('\n' + chalk_1.default.green('✨ Project healing complete!'));
        if (options.generateTests) {
            console.log(chalk_1.default.cyan('\n📊 Test Generation Summary:'));
            console.log(`  ${chalk_1.default.green('✓')} Generated tests for ${uniqueFilePaths.length} components`);
        }
    }
    catch (error) {
        healingSpinner.fail('Healing failed');
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
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
    const spinner = (0, ora_1.default)('Setting up test generation...').start();
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
        const testReport = await (0, test_generation_engine_1.generateTests)(context, testOptions);
        spinner.succeed('Test generation complete');
        // Display test generation report
        console.log('\n' + chalk_1.default.cyan('🧪 Context-Aware Test Generation Report:'));
        // Show summary
        console.log(`  ${chalk_1.default.green('✓')} Processed ${testReport.summary.total} files`);
        console.log(`  ${chalk_1.default.green('✓')} Created ${testReport.summary.created} new test files`);
        console.log(`  ${chalk_1.default.yellow('⚠')} Skipped ${testReport.summary.skipped} existing files`);
        // Display by file type
        console.log('\nTests by file type:');
        console.log(`  ${chalk_1.default.green('✓')} ${chalk_1.default.bold('Components')}: ${testReport.summary.componentTests}`);
        console.log(`  ${chalk_1.default.green('✓')} ${chalk_1.default.bold('Hooks')}: ${testReport.summary.hookTests}`);
        console.log(`  ${chalk_1.default.green('✓')} ${chalk_1.default.bold('Utilities')}: ${testReport.summary.utilityTests}`);
        // Group by operation type
        const testsByType = testReport.operations.reduce((acc, op) => {
            const key = `${op.type} ${op.entityKind || ''}`.trim();
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        console.log('\nOperation details:');
        Object.entries(testsByType).forEach(([type, count]) => {
            const color = type.includes('error') ? chalk_1.default.red :
                type.includes('skip') ? chalk_1.default.yellow :
                    type.includes('dryrun') ? chalk_1.default.blue :
                        chalk_1.default.green;
            console.log(`  ${color('•')} ${chalk_1.default.bold(type)}: ${count}`);
        });
        // Show some examples of created tests
        const createdTests = testReport.operations.filter(op => op.success && op.testPath);
        if (createdTests.length > 0) {
            console.log('\nExample tests created:');
            createdTests.slice(0, Math.min(5, createdTests.length)).forEach(op => {
                console.log(`  ${chalk_1.default.green('✓')} ${path_1.default.relative(options.dir, op.testPath || '')} (${op.entityKind || 'unknown'})`);
            });
            if (createdTests.length > 5) {
                console.log(`  ${chalk_1.default.gray('... and')} ${createdTests.length - 5} ${chalk_1.default.gray('more')}`);
            }
        }
        console.log('\n' + chalk_1.default.green('✨ Context-aware test generation complete!'));
        if (options.dryRun) {
            console.log(chalk_1.default.yellow('\n⚠️  DRY RUN MODE - No files were created'));
            console.log(chalk_1.default.yellow('   Run without --dry-run to create the test files'));
        }
    }
    catch (error) {
        spinner.fail('Test generation failed');
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
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
    const spinner = (0, ora_1.default)('Analyzing TypeScript best practices...').start();
    try {
        const context = await createContext(options.dir);
        // Import the validator directly to avoid circular dependencies
        const { validateTypeScriptBestPractices } = await Promise.resolve().then(() => __importStar(require('../validators/typescript-best-practices-validator')));
        const bestPracticesResults = await validateTypeScriptBestPractices(context);
        spinner.succeed('Analysis complete!');
        // Display results
        console.log('\n' + chalk_1.default.cyan('🛡️ TypeScript Best Practices Results:'));
        if (bestPracticesResults.issues.length === 0) {
            console.log(chalk_1.default.green('✨ No TypeScript best practice issues found!'));
        }
        else {
            console.log(chalk_1.default.yellow(`Found ${bestPracticesResults.issues.length} TypeScript best practice issues`));
            // Group issues by type
            const issuesByCode = bestPracticesResults.issues.reduce((acc, issue) => {
                const code = issue.code || 'other';
                acc[code] = acc[code] || [];
                acc[code].push(issue);
                return acc;
            }, {});
            // Display grouped issues
            Object.entries(issuesByCode).forEach(([code, issues]) => {
                console.log(`\n${chalk_1.default.bold(code)}: ${issues.length} issues`);
                issues.slice(0, 3).forEach(issue => {
                    console.log(`  ${issue.type === 'error' ? chalk_1.default.red('✗') : chalk_1.default.yellow('⚠')} ${issue.message} (${issue.filePath}:${issue.line})`);
                });
                if (issues.length > 3) {
                    console.log(chalk_1.default.gray(`  ... and ${issues.length - 3} more similar issues`));
                }
            });
            if (options.fix) {
                console.log('\n' + chalk_1.default.cyan('🔧 Fixing TypeScript best practice issues...'));
                // Implement fix logic here when available
                console.log(chalk_1.default.yellow('Automatic fixing is not yet implemented for all issues'));
                console.log(chalk_1.default.cyan('💡 See documentation in /docs/typescript-error-prevention.md for manual fixes'));
            }
            else {
                console.log(chalk_1.default.cyan('\n💡 Run with --fix to attempt automatic fixes'));
                console.log(chalk_1.default.cyan('📖 See documentation in /docs/typescript-error-prevention.md for details'));
            }
        }
    }
    catch (error) {
        spinner.fail('Analysis failed');
        console.error(chalk_1.default.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
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
function displaySummary(report) {
    console.log('\n' + chalk_1.default.cyan('📊 Analysis Summary:'));
    // Count issues by severity
    const errorCount = countIssuesBySeverity(report, 'error');
    const warningCount = countIssuesBySeverity(report, 'warning');
    const suggestionCount = countIssuesBySeverity(report, 'suggestion');
    console.log(`  ${chalk_1.default.red('✗')} ${chalk_1.default.bold(errorCount)} errors`);
    console.log(`  ${chalk_1.default.yellow('⚠')} ${chalk_1.default.bold(warningCount)} warnings`);
    console.log(`  ${chalk_1.default.blue('ℹ')} ${chalk_1.default.bold(suggestionCount)} suggestions`);
    // Count issues by framework
    console.log('\nIssues by framework:');
    const frameworkCounts = countIssuesByFramework(report);
    Object.entries(frameworkCounts).forEach(([framework, count]) => {
        const color = count > 0 ? chalk_1.default.yellow : chalk_1.default.green;
        console.log(`  ${color(framework)}: ${count}`);
    });
    if (errorCount + warningCount + suggestionCount === 0) {
        console.log('\n' + chalk_1.default.green('✨ No issues found! Your project is aligned with best practices.'));
    }
    else {
        console.log('\n' + chalk_1.default.cyan('💡 Next steps:'));
        console.log(`  Run ${chalk_1.default.bold('stack-align heal')} to automatically fix detected issues`);
        console.log(`  Or run ${chalk_1.default.bold('stack-align heal --dry-run')} to preview changes first`);
    }
}
// Helper to count issues by severity
function countIssuesBySeverity(report, severity) {
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
function displayRuleCoverageSummary(report) {
    console.log('\n' + chalk_1.default.cyan('📊 Rule Coverage Summary:'));
    console.log('---------------------------------------');
    // Count issues and files by framework
    const issuesByFramework = countIssuesByFramework(report);
    const filesByFramework = countFilesByFramework(report);
    // Group issues by rule code
    const issuesByRuleCode = groupIssuesByRuleCode(report);
    // Prepare summary by framework
    Object.entries(issuesByFramework).forEach(([framework, count]) => {
        if (framework !== 'other' && (count > 0 || filesByFramework[framework] > 0)) {
            console.log(`\n${chalk_1.default.bold(framework.toUpperCase())}: ${count} issues in ${filesByFramework[framework]} files`);
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
                    ruleStatus = chalk_1.default.red('⚠️');
                }
                else if (rule.warningCount > 0) {
                    ruleStatus = chalk_1.default.yellow('⚠️');
                }
                else {
                    ruleStatus = chalk_1.default.blue('ℹ️');
                }
                console.log(`  ${ruleStatus} ${rule.code}: ${rule.count} occurrences`);
            });
        }
    });
    if (Object.values(issuesByFramework).every(count => count === 0)) {
        console.log('\n' + chalk_1.default.green('✨ No issues found! Your project is aligned with best practices.'));
    }
    else {
        console.log('\n' + chalk_1.default.cyan('💡 Next steps:'));
        console.log(`  Run ${chalk_1.default.bold('stack-align heal')} to automatically fix detected issues`);
        console.log(`  Or run ${chalk_1.default.bold('stack-align heal --dry-run')} to preview changes first`);
    }
}
/**
 * Groups issues by rule code (e.g., REACT19_HOOKS_DEPS)
 */
function groupIssuesByRuleCode(report) {
    const result = {};
    function processIssues(issues) {
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
function countFilesByFramework(report) {
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
        var _a;
        if (((_a = report.results.frameworks[key]) === null || _a === void 0 ? void 0 : _a.issues.length) > 0 && counts[key] === 0) {
            counts[key] = 1;
        }
    });
    return counts;
}
// Helper to count issues by framework
function countIssuesByFramework(report) {
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
    function addIssues(issues) {
        issues.forEach(issue => {
            const framework = issue.framework || 'other';
            counts[framework] = (counts[framework] || 0) + 1;
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
// Run the CLI if this file is executed directly
if (require.main === module) {
    program.parse(process.argv);
}
