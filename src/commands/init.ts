import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

export interface InitOptions {
  template: 'basic' | 'advanced';
}

export async function initProject(options: InitOptions) {
  const spinner = ora('Initializing project...').start();

  try {
    // Get project details
    spinner.stop();
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: path.basename(process.cwd())
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'Chalee API types project'
      },
      {
        type: 'confirm',
        name: 'useGit',
        message: 'Initialize Git repository?',
        default: true
      }
    ]);

    spinner.start('Creating project structure...');

    // Create basic project structure
    await fs.ensureDir('src');
    await fs.ensureDir('types');
    await fs.ensureDir('schemas');

    // Create configuration file
    const config = {
      name: answers.projectName,
      description: answers.description,
      version: '1.0.0',
      schemaPath: './schemas',
      outputPath: './types',
      format: 'ts',
      includeComments: true
    };

    await fs.writeJSON('chalee.config.json', config, { spaces: 2 });

    // Create example schema
    const exampleSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "User API",
      "type": "object",
      "definitions": {
        "User": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "name": { "type": "string" },
            "email": { "type": "string", "format": "email" },
            "createdAt": { "type": "string", "format": "date-time" }
          },
          "required": ["id", "name", "email"]
        }
      }
    };

    await fs.writeJSON('schemas/example.json', exampleSchema, { spaces: 2 });

    // Create README
    const readme = `# ${answers.projectName}

${answers.description}

## Getting Started

1. Define your API schemas in the \`schemas/\` directory
2. Run \`chalee-types generate\` to generate TypeScript types
3. Import the generated types in your project

## Commands

- \`chalee-types generate\` - Generate types from schemas
- \`chalee-types validate <schema>\` - Validate a schema file
- \`chalee-types sync --url <url>\` - Sync types from remote API

## Configuration

Edit \`chalee.config.json\` to customize the generation process.
`;

    await fs.writeFile('README.md', readme);

    // Create .gitignore if using Git
    if (answers.useGit) {
      const gitignore = `node_modules/
dist/
*.log
.env
.DS_Store
`;
      await fs.writeFile('.gitignore', gitignore);
    }

    spinner.succeed(chalk.green('Project initialized successfully!'));
    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.gray('1. Edit schemas in the schemas/ directory'));
    console.log(chalk.gray('2. Run: chalee-types generate'));
    console.log(chalk.gray('3. Import generated types from ./types/'));

  } catch (error: any) {
    spinner.fail(`Failed to initialize project: ${error.message}`);
    process.exit(1);
  }
}