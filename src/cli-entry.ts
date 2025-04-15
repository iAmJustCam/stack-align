#!/usr/bin/env node

/**
 * CLI Entry Point
 * 
 * This file provides a simplified, consistent entry point for the CLI tool
 * no matter how it's invoked (npx, global install, or local script).
 */
import { program } from './cli';

// Add aliases for common commands to make the CLI more intuitive
program
  .command('check')
  .description('Alias for "analyze" - check project against best practices')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--strict', 'Enable strict validation mode')
  .option('--summary', 'Show summary of rule coverage instead of detailed report')
  .option('--report <format>', 'Report format (console, json, html)', 'console')
  .option('--save <filename>', 'Save report to file')
  .option('--focus <area>', 'Focus analysis on specific area (react, nextjs, typescript, tailwind, tests)')
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action((options) => {
    // Forward to the main analyze command
    program.parseAsync(['analyze', 
      '-d', options.dir,
      options.strict ? '--strict' : '',
      options.summary ? '--summary' : '',
      options.report ? `--report=${options.report}` : '',
      options.save ? `--save=${options.save}` : '',
      options.focus ? `--focus=${options.focus}` : '',
      options.config ? `--config=${options.config}` : '',
    ].filter(Boolean));
  });

program
  .command('align')
  .description('Alias for "heal" - fix issues in project automatically')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--dry-run', 'Show changes without applying them')
  .option('--max-fix <number>', 'Maximum number of fixes to apply (unlimited by default)', parseInt)
  .option('--filter <area>', 'Only heal specific areas (react, nextjs, typescript, tailwind, tests)')
  .option('--component <n>', 'Only heal specific component')
  .option('--generate-tests', 'Generate tests for fixed components', false)
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action((options) => {
    // Forward to the main heal command
    program.parseAsync(['heal', 
      '-d', options.dir,
      options.dryRun ? '--dry-run' : '',
      options.maxFix ? `--max-fix=${options.maxFix}` : '',
      options.filter ? `--filter=${options.filter}` : '',
      options.component ? `--component=${options.component}` : '',
      options.generateTests ? '--generate-tests' : '',
      options.config ? `--config=${options.config}` : '',
    ].filter(Boolean));
  });

program
  .command('report')
  .description('Generate and save a report of project health')
  .option('-d, --dir <directory>', 'Project directory', '.')
  .option('--strict', 'Enable strict validation mode')
  .option('--format <format>', 'Report format (json, html)', 'html')
  .option('--output <filename>', 'Output file name', 'stack-align-report')
  .option('--config <path>', 'Path to configuration file', './stack-align.config.js')
  .action((options) => {
    const outputFile = `${options.output}.${options.format}`;
    
    // Forward to analyze with report options
    program.parseAsync(['analyze', 
      '-d', options.dir,
      options.strict ? '--strict' : '',
      `--report=${options.format}`,
      `--save=${outputFile}`,
      options.config ? `--config=${options.config}` : '',
    ].filter(Boolean));
  });

// Run the program
if (require.main === module) {
  program.parse(process.argv);
}

// Export for testing
export { program };