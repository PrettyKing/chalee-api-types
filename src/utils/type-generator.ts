import { JSONSchema7 } from 'json-schema';
import { ParsedSchema } from './schema-parser';
import _ from 'lodash';

export interface GeneratorOptions {
  format: 'ts' | 'js' | 'json';
  includeComments: boolean;
  exportMode?: 'named' | 'default' | 'both';
}

export class TypeGenerator {
  constructor(private options: GeneratorOptions) {}

  generate(schema: ParsedSchema): string {
    switch (this.options.format) {
      case 'ts':
        return this.generateTypeScript(schema);
      case 'js':
        return this.generateJavaScript(schema);
      case 'json':
        return this.generateJSON(schema);
      default:
        throw new Error(`Unsupported format: ${this.options.format}`);
    }
  }

  generateFromRemoteSchema(remoteSchema: any): string {
    // Convert remote schema to our internal format
    const schema: ParsedSchema = {
      title: remoteSchema.info?.title || 'Remote API',
      version: remoteSchema.info?.version || '1.0.0',
      definitions: this.extractDefinitionsFromRemote(remoteSchema)
    };

    return this.generateTypeScript(schema);
  }

  private generateTypeScript(schema: ParsedSchema): string {
    let output = '';

    // Add header comment
    if (this.options.includeComments) {
      output += this.generateHeader(schema);
    }

    // Generate type definitions
    const typeDefinitions: string[] = [];
    
    for (const [name, definition] of Object.entries(schema.definitions)) {
      const typeString = this.generateTypeDefinition(name, definition);
      typeDefinitions.push(typeString);
    }

    output += typeDefinitions.join('\n\n');

    // Add exports
    const typeNames = Object.keys(schema.definitions);
    if (typeNames.length > 0) {
      output += '\n\n// Exports\n';
      output += `export type { ${typeNames.join(', ')} };\n`;
      
      if (this.options.exportMode === 'default' || this.options.exportMode === 'both') {
        output += `\nexport default { ${typeNames.join(', ')} };\n`;
      }
    }

    return output;
  }

  private generateTypeDefinition(name: string, schema: JSONSchema7): string {
    let output = '';

    // Add comment if enabled
    if (this.options.includeComments && schema.description) {
      output += `/**\n * ${schema.description}\n */\n`;
    }

    // Generate the type
    const typeString = this.schemaToTypeScript(schema);
    output += `export interface ${name} ${typeString}`;

    return output;
  }

  private schemaToTypeScript(schema: JSONSchema7): string {
    if (schema.type === 'object' || schema.properties) {
      return this.generateObjectType(schema);
    }
    
    if (schema.type === 'array') {
      const itemsType = schema.items 
        ? this.schemaToTypeScript(schema.items as JSONSchema7)
        : 'any';
      return `${itemsType}[]`;
    }
    
    if (schema.enum) {
      return schema.enum.map(v => JSON.stringify(v)).join(' | ');
    }
    
    if (schema.oneOf || schema.anyOf) {
      const variants = (schema.oneOf || schema.anyOf) as JSONSchema7[];
      return variants.map(v => this.schemaToTypeScript(v)).join(' | ');
    }

    return this.primitiveToTypeScript(schema);
  }

  private generateObjectType(schema: JSONSchema7): string {
    if (!schema.properties) {
      return '{}';
    }

    const properties: string[] = [];
    const required = schema.required || [];

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const isRequired = required.includes(propName);
      const questionMark = isRequired ? '' : '?';
      
      let propType = this.schemaToTypeScript(propSchema as JSONSchema7);
      
      // Add comment for property if available
      let comment = '';
      if (this.options.includeComments && (propSchema as JSONSchema7).description) {
        comment = `  /** ${(propSchema as JSONSchema7).description} */\n`;
      }
      
      properties.push(`${comment}  ${propName}${questionMark}: ${propType};`);
    }

    return `{\n${properties.join('\n')}\n}`;
  }

  private primitiveToTypeScript(schema: JSONSchema7): string {
    switch (schema.type) {
      case 'string':
        if (schema.format === 'date-time') return 'Date | string';
        if (schema.format === 'date') return 'string';
        if (schema.format === 'email') return 'string';
        if (schema.format === 'uri') return 'string';
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'null':
        return 'null';
      default:
        return 'any';
    }
  }

  private generateJavaScript(schema: ParsedSchema): string {
    // Generate JSDoc types for JavaScript
    let output = '';
    
    if (this.options.includeComments) {
      output += this.generateHeader(schema);
    }

    for (const [name, definition] of Object.entries(schema.definitions)) {
      output += this.generateJSDocType(name, definition) + '\n\n';
    }

    return output;
  }

  private generateJSDocType(name: string, schema: JSONSchema7): string {
    let output = `/**\n * @typedef {Object} ${name}\n`;
    
    if (schema.description) {
      output += ` * @description ${schema.description}\n`;
    }
    
    if (schema.properties) {
      const required = schema.required || [];
      
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        const propType = this.schemaToJSDocType(propSchema as JSONSchema7);
        const isOptional = !required.includes(propName);
        const optional = isOptional ? '=] ' : '] ';
        
        output += ` * @property {${propType}${optional}${propName}`;
        
        if ((propSchema as JSONSchema7).description) {
          output += ` - ${(propSchema as JSONSchema7).description}`;
        }
        
        output += '\n';
      }
    }
    
    output += ' */';
    return output;
  }

  private schemaToJSDocType(schema: JSONSchema7): string {
    if (schema.type === 'array') {
      const itemsType = schema.items 
        ? this.schemaToJSDocType(schema.items as JSONSchema7)
        : '*';
      return `${itemsType}[]`;
    }
    
    switch (schema.type) {
      case 'string': return 'string';
      case 'number':
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'object': return 'Object';
      default: return '*';
    }
  }

  private generateJSON(schema: ParsedSchema): string {
    return JSON.stringify(schema, null, 2);
  }

  private generateHeader(schema: ParsedSchema): string {
    const now = new Date().toISOString();
    return `/**
 * ${schema.title || 'API Types'}
 * ${schema.version ? `Version: ${schema.version}` : ''}
 * Generated on: ${now}
 * 
 * This file was automatically generated by chalee-api-types.
 * Do not edit this file directly.
 */

`;
  }

  private extractDefinitionsFromRemote(remoteSchema: any): Record<string, JSONSchema7> {
    const definitions: Record<string, JSONSchema7> = {};
    
    // Try different schema locations
    const schemas = 
      remoteSchema.components?.schemas ||
      remoteSchema.definitions ||
      remoteSchema.schemas ||
      {};
      
    for (const [name, definition] of Object.entries(schemas)) {
      definitions[name] = definition as JSONSchema7;
    }
    
    return definitions;
  }
}