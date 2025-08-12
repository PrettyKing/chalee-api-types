#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { generateTypes } from './commands/generate';
import { initProject } from './commands/init';
import { validateSchema } from './commands/validate';
import { syncTypes } from './commands/sync';

const program = new Command();

program
  .name('chalee-types')
  .description('CLI tool for managing Chalee API types and code generation')
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .alias('gen')
  .description('Generate TypeScript types from API schema')
  .option('-i, --input <path>', 'Input schema file path')
  .option('-o, --output <path>', 'Output directory', './types')
  .option('-f, --format <format>', 'Output format (ts|js|json)', 'ts')
  .option('--no-comments', 'Exclude comments in generated types')
  .action(generateTypes);

// Initialize command
program
  .command('init')
  .description('Initialize a new Chalee types project')
  .option('-t, --template <template>', 'Project template (basic|advanced)', 'basic')
  .action(initProject);

// Validate command
program
  .command('validate')
  .description('Validate API schema file')
  .argument('<schema>', 'Schema file to validate')
  .option('--strict', 'Enable strict validation mode')
  .action(validateSchema);

// Sync command
program
  .command('sync')
  .description('Sync types from remote API endpoint')
  .option('-u, --url <url>', 'API endpoint URL')
  .option('-o, --output <path>', 'Output directory', './types')
  .option('-h, --headers <headers>', 'Custom headers (JSON format)')
  .action(syncTypes);

// Global error handling
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('See --help for a list of available commands.'));
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}