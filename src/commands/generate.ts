import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { SchemaParser } from '../utils/schema-parser';
import { TypeGenerator } from '../utils/type-generator';

export interface GenerateOptions {
  input?: string;
  output: string;
  format: 'ts' | 'js' | 'json';
  comments: boolean;
}

export async function generateTypes(options: GenerateOptions) {
  const spinner = ora('Generating types...').start();

  try {
    // Determine input file
    const inputFile = options.input || await findSchemaFile();
    
    if (!inputFile) {
      spinner.fail('No schema file found. Please specify with --input option.');
      process.exit(1);
    }

    if (!await fs.pathExists(inputFile)) {
      spinner.fail(`Schema file not found: ${inputFile}`);
      process.exit(1);
    }

    // Parse schema
    spinner.text = 'Parsing schema...';
    const schemaContent = await fs.readFile(inputFile, 'utf-8');
    const parser = new SchemaParser();
    const schema = parser.parse(schemaContent);

    // Generate types
    spinner.text = 'Generating TypeScript types...';
    const generator = new TypeGenerator({
      format: options.format,
      includeComments: options.comments
    });
    const generatedCode = generator.generate(schema);

    // Ensure output directory exists
    await fs.ensureDir(options.output);

    // Write generated files
    const outputFile = path.join(options.output, `index.${options.format}`);
    await fs.writeFile(outputFile, generatedCode);

    spinner.succeed(chalk.green(`Types generated successfully!`));
    console.log(chalk.cyan(`Output: ${outputFile}`));
    console.log(chalk.gray(`Generated ${Object.keys(schema.definitions || {}).length} type definitions`));

  } catch (error: any) {
    spinner.fail(`Failed to generate types: ${error.message}`);
    console.error(chalk.red(error.stack));
    process.exit(1);
  }
}

async function findSchemaFile(): Promise<string | null> {
  const possibleFiles = [
    'api-schema.json',
    'schema.json',
    'openapi.json',
    'swagger.json',
    'api.json'
  ];

  for (const file of possibleFiles) {
    if (await fs.pathExists(file)) {
      return file;
    }
  }

  return null;
}