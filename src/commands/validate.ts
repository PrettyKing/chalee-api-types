import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import { SchemaParser } from '../utils/schema-parser';

export async function validateSchema(schemaPath: string, options: { strict?: boolean }) {
  const spinner = ora('Validating schema...').start();

  try {
    if (!await fs.pathExists(schemaPath)) {
      spinner.fail(`Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const schemaContent = await fs.readFile(schemaPath, 'utf-8');
    const parser = new SchemaParser();
    
    const validation = parser.validate(schemaContent, { strict: options.strict });
    
    if (validation.valid) {
      spinner.succeed(chalk.green('Schema is valid!'));
      if (validation.warnings && validation.warnings.length > 0) {
        console.log(chalk.yellow('\nWarnings:'));
        validation.warnings.forEach(warning => {
          console.log(chalk.yellow(`  • ${warning}`));
        });
      }
    } else {
      spinner.fail('Schema validation failed!');
      console.log(chalk.red('\nErrors:'));
      validation.errors.forEach(error => {
        console.log(chalk.red(`  • ${error}`));
      });
      process.exit(1);
    }

  } catch (error: any) {
    spinner.fail(`Validation failed: ${error.message}`);
    process.exit(1);
  }
}