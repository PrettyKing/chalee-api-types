import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { TypeGenerator } from '../utils/type-generator';

export interface SyncOptions {
  url?: string;
  output: string;
  headers?: string;
}

export async function syncTypes(options: SyncOptions) {
  const spinner = ora('Syncing types from remote API...').start();

  try {
    if (!options.url) {
      spinner.fail('API URL is required. Use --url option.');
      process.exit(1);
    }

    // Parse custom headers
    let headers = {};
    if (options.headers) {
      try {
        headers = JSON.parse(options.headers);
      } catch (error) {
        spinner.fail('Invalid headers format. Use JSON format.');
        process.exit(1);
      }
    }

    // Fetch schema from remote API
    spinner.text = 'Fetching schema from remote API...';
    const response = await axios.get(options.url, { headers });
    
    if (!response.data) {
      spinner.fail('No data received from API');
      process.exit(1);
    }

    // Generate types from fetched schema
    spinner.text = 'Generating types...';
    const generator = new TypeGenerator({
      format: 'ts',
      includeComments: true
    });

    const generatedCode = generator.generateFromRemoteSchema(response.data);

    // Ensure output directory exists
    await fs.ensureDir(options.output);

    // Write generated files
    const outputFile = path.join(options.output, 'remote-types.ts');
    await fs.writeFile(outputFile, generatedCode);

    // Save raw schema for reference
    const schemaFile = path.join(options.output, 'remote-schema.json');
    await fs.writeJSON(schemaFile, response.data, { spaces: 2 });

    spinner.succeed(chalk.green('Types synced successfully!'));
    console.log(chalk.cyan(`Types: ${outputFile}`));
    console.log(chalk.cyan(`Schema: ${schemaFile}`));

  } catch (error) {
    if (error.response) {
      spinner.fail(`API request failed: ${error.response.status} ${error.response.statusText}`);
    } else {
      spinner.fail(`Sync failed: ${error.message}`);
    }
    process.exit(1);
  }
}