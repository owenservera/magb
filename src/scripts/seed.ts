/**
 * Database Seed Script
 * 
 * Populates the database with initial targets and sample data for testing.
 * Run with: bun run src/scripts/seed.ts
 */

import { UniversalKnowledgeStore } from '@/engine/store';
import { logger } from '@/lib/logger';

async function seed() {
  const log = logger;
  log.info('Starting database seed...');
  
  const store = new UniversalKnowledgeStore();
  
  try {
    // Seed initial targets
    const targets = [
      {
        id: 'json',
        name: 'JSON',
        kind: 'DATA_FORMAT' as const,
        description: 'JavaScript Object Notation - A lightweight data-interchange format',
        extensions: ['.json'],
        mediaTypes: ['application/json'],
        tier: 1,
        generationStatus: 'NOT_STARTED' as const,
        metadata: {
          spec_url: 'https://www.json.org/',
          version: 'ECMA-404',
        },
      },
      {
        id: 'python',
        name: 'Python',
        kind: 'PROGRAMMING_LANGUAGE' as const,
        description: 'A high-level, general-purpose programming language',
        extensions: ['.py', '.pyw', '.pyi'],
        mediaTypes: ['text/x-python'],
        tier: 1,
        generationStatus: 'NOT_STARTED' as const,
        metadata: {
          spec_url: 'https://docs.python.org/3/reference/',
          version: '3.12',
        },
      },
      {
        id: 'typescript',
        name: 'TypeScript',
        kind: 'PROGRAMMING_LANGUAGE' as const,
        description: 'A typed superset of JavaScript that compiles to plain JavaScript',
        extensions: ['.ts', '.tsx', '.d.ts'],
        mediaTypes: ['text/typescript'],
        tier: 1,
        generationStatus: 'NOT_STARTED' as const,
        metadata: {
          spec_url: 'https://www.typescriptlang.org/docs/',
          version: '5.4',
        },
      },
      {
        id: 'pptx',
        name: 'PPTX',
        kind: 'FILE_FORMAT' as const,
        description: 'Microsoft PowerPoint Open XML Presentation format',
        extensions: ['.pptx'],
        mediaTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        tier: 2,
        generationStatus: 'NOT_STARTED' as const,
        metadata: {
          spec_url: 'https://learn.microsoft.com/en-us/previous-versions/office/developer/office-2010/ee406337(v=office.14)',
          version: 'Office Open XML',
        },
      },
      {
        id: 'yaml',
        name: 'YAML',
        kind: 'CONFIG_FORMAT' as const,
        description: 'YAML Ain\'t Markup Language - A human-readable data serialization standard',
        extensions: ['.yaml', '.yml'],
        mediaTypes: ['application/x-yaml', 'application/yaml'],
        tier: 2,
        generationStatus: 'NOT_STARTED' as const,
        metadata: {
          spec_url: 'https://yaml.org/spec/',
          version: '1.2',
        },
      },
    ];
    
    log.info('Seeding targets...');
    
    for (const target of targets) {
      await store.db.target.upsert({
        where: { id: target.id },
        update: target,
        create: target,
      });
      log.info(`✓ Seeded target: ${target.id}`);
    }
    
    // Seed concepts
    const concepts = [
      {
        id: 'iteration',
        name: 'Iteration',
        domain: 'control_flow',
        description: 'Repeating a block of code multiple times',
        summary: 'Executing a set of instructions repeatedly',
        metadata: {},
      },
      {
        id: 'error_handling',
        name: 'Error Handling',
        domain: 'control_flow',
        description: 'Managing and responding to exceptional conditions',
        summary: 'Catching and handling runtime errors',
        metadata: {},
      },
      {
        id: 'type_system',
        name: 'Type System',
        domain: 'types',
        description: 'Rules for assigning types to program constructs',
        summary: 'How types are defined and checked',
        metadata: {},
      },
      {
        id: 'data_serialization',
        name: 'Data Serialization',
        domain: 'data',
        description: 'Converting data structures to a storable/transmittable format',
        summary: 'Encoding data for storage or transmission',
        metadata: {},
      },
    ];
    
    log.info('Seeding concepts...');
    
    for (const concept of concepts) {
      await store.db.concept.upsert({
        where: { id: concept.id },
        update: concept,
        create: concept,
      });
      log.info(`✓ Seeded concept: ${concept.id}`);
    }
    
    // Seed sample capabilities for JSON
    const jsonCapabilities = [
      {
        id: 'cap_json_parse',
        targetId: 'json',
        name: 'Parse JSON',
        category: 'Parsing',
        userDescription: 'Convert a JSON string into a data structure',
        complexity: 'BASIC' as const,
      },
      {
        id: 'cap_json_stringify',
        targetId: 'json',
        name: 'Serialize to JSON',
        category: 'Serialization',
        userDescription: 'Convert a data structure into a JSON string',
        complexity: 'BASIC' as const,
      },
      {
        id: 'cap_json_validate',
        targetId: 'json',
        name: 'Validate JSON',
        category: 'Validation',
        userDescription: 'Check if a string is valid JSON',
        complexity: 'BASIC' as const,
      },
    ];
    
    log.info('Seeding JSON capabilities...');
    
    for (const cap of jsonCapabilities) {
      await store.db.capability.upsert({
        where: { id: cap.id },
        update: cap,
        create: cap,
      });
      log.info(`✓ Seeded capability: ${cap.id}`);
    }
    
    // Seed sample algorithms
    const algorithms = [
      {
        id: 'algo_json_recursive_descent',
        name: 'Recursive Descent Parsing',
        category: 'Parsing',
        domain: 'data_processing',
        purpose: 'Parse JSON using recursive descent algorithm',
        pseudocode: JSON.stringify([
          'function parse():',
          '  skip whitespace',
          '  value = parseValue()',
          '  skip whitespace',
          '  return value',
          '',
          'function parseValue():',
          '  char = peek()',
          '  if char == "{": return parseObject()',
          '  if char == "[": return parseArray()',
          '  if char == "\\"": return parseString()',
          '  if char in "0-9-": return parseNumber()',
          '  if char == "t" or "f": return parseBoolean()',
          '  if char == "n": return parseNull()',
        ]),
      },
    ];
    
    log.info('Seeding algorithms...');
    
    for (const algo of algorithms) {
      await store.db.algorithm.upsert({
        where: { id: algo.id },
        update: algo,
        create: algo,
      });
      log.info(`✓ Seeded algorithm: ${algo.id}`);
    }
    
    // Seed sample atoms for JSON
    const atoms = [
      {
        id: 'atom_json_object',
        targetId: 'json',
        atomType: 'SYNTAX_RULE' as const,
        elementName: 'Object',
        semanticMeaning: 'A collection of key-value pairs',
        structure: {
          syntax: '{ "key": value, ... }',
          rules: [
            'Keys must be strings',
            'Values can be any JSON type',
            'Keys must be unique',
            'Comma separates pairs',
          ],
        },
      },
      {
        id: 'atom_json_array',
        targetId: 'json',
        atomType: 'SYNTAX_RULE' as const,
        elementName: 'Array',
        semanticMeaning: 'An ordered list of values',
        structure: {
          syntax: '[value1, value2, ...]',
          rules: [
            'Values can be any JSON type',
            'Comma separates values',
            'Order is preserved',
          ],
        },
      },
    ];
    
    log.info('Seeding atoms...');
    
    for (const atom of atoms) {
      await store.db.atom.upsert({
        where: { id: atom.id },
        update: atom,
        create: atom,
      });
      log.info(`✓ Seeded atom: ${atom.id}`);
    }
    
    // Create relations between capabilities and atoms
    const relations = [
      {
        sourceId: 'cap_json_parse',
        sourceType: 'capability',
        relTargetId: 'atom_json_object',
        relTargetType: 'atom',
        relationType: 'REQUIRES' as const,
      },
      {
        sourceId: 'cap_json_parse',
        sourceType: 'capability',
        relTargetId: 'atom_json_array',
        relTargetType: 'atom',
        relationType: 'REQUIRES' as const,
      },
    ];
    
    log.info('Seeding relations...');
    
    for (const relation of relations) {
      await store.db.relation.create({
        data: relation,
      });
      log.info(`✓ Created relation: ${relation.sourceId} → ${relation.relTargetId}`);
    }
    
    log.info('Database seed completed successfully!');
    
    // Print summary
    const stats = await store.getStatistics();
    log.info('Database Statistics:', stats);
    
  } catch (error) {
    log.errorWithStack('Seed failed', error as Error);
    process.exit(1);
  } finally {
    await store.disconnect();
  }
}

// Run the seed
seed();
