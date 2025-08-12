import { JSONSchema7 } from 'json-schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ParsedSchema {
  title?: string;
  version?: string;
  definitions: Record<string, JSONSchema7>;
  paths?: Record<string, any>;
}

export class SchemaParser {
  parse(schemaContent: string): ParsedSchema {
    try {
      const schema = JSON.parse(schemaContent);
      
      // Handle OpenAPI/Swagger format
      if (schema.openapi || schema.swagger) {
        return this.parseOpenAPI(schema);
      }
      
      // Handle JSON Schema format
      if (schema.$schema || schema.definitions) {
        return this.parseJSONSchema(schema);
      }
      
      throw new Error('Unsupported schema format');
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON syntax in schema file');
      }
      throw error;
    }
  }

  validate(schemaContent: string, options: { strict?: boolean } = {}): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const schema = JSON.parse(schemaContent);
      
      // Basic validation
      if (!schema || typeof schema !== 'object') {
        errors.push('Schema must be a valid JSON object');
        return { valid: false, errors, warnings };
      }

      // Check for required fields based on schema type
      if (schema.openapi || schema.swagger) {
        this.validateOpenAPI(schema, errors, warnings, options.strict);
      } else {
        this.validateJSONSchema(schema, errors, warnings, options.strict);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error: any) {
      errors.push(`Invalid JSON: ${error.message}`);
      return { valid: false, errors, warnings };
    }
  }

  private parseOpenAPI(schema: any): ParsedSchema {
    const definitions: Record<string, JSONSchema7> = {};
    
    // Extract components/schemas (OpenAPI 3.x) or definitions (Swagger 2.x)
    const schemas = schema.components?.schemas || schema.definitions || {};
    
    for (const [name, definition] of Object.entries(schemas)) {
      definitions[name] = definition as JSONSchema7;
    }

    return {
      title: schema.info?.title,
      version: schema.info?.version,
      definitions,
      paths: schema.paths
    };
  }

  private parseJSONSchema(schema: any): ParsedSchema {
    return {
      title: schema.title,
      version: schema.version,
      definitions: schema.definitions || { Root: schema }
    };
  }

  private validateOpenAPI(schema: any, errors: string[], warnings: string[], strict?: boolean) {
    if (!schema.info) {
      errors.push('OpenAPI schema missing required "info" object');
    } else {
      if (!schema.info.title) {
        errors.push('OpenAPI info missing required "title" field');
      }
      if (!schema.info.version) {
        errors.push('OpenAPI info missing required "version" field');
      }
    }

    if (!schema.paths) {
      if (strict) {
        errors.push('OpenAPI schema missing "paths" object');
      } else {
        warnings.push('OpenAPI schema missing "paths" object');
      }
    }

    if (schema.openapi) {
      if (!schema.openapi.startsWith('3.')) {
        warnings.push('Consider upgrading to OpenAPI 3.x');
      }
    }
  }

  private validateJSONSchema(schema: any, errors: string[], warnings: string[], strict?: boolean) {
    if (!schema.$schema && strict) {
      warnings.push('Consider adding $schema field for better validation');
    }

    if (!schema.definitions && !schema.properties) {
      warnings.push('Schema has no definitions or properties');
    }
  }
}