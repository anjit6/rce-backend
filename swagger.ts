import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'Rules Configuration Engine API',
    version: '1.0.0',
    description: 'Backend API for managing business rules with approval workflow, versioning, and mapping',
  },
  host: 'localhost:8080',
  basePath: '/api',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    { name: 'Authentication', description: 'Authentication and authorization endpoints' },
    { name: 'Categories', description: 'Category management for organizing subfunctions' },
    { name: 'Subfunctions', description: 'Reusable function definitions' },
    { name: 'Rules', description: 'Rule management and configuration' },
    { name: 'Rule Functions', description: 'Rule implementation details' },
    { name: 'Rule Function Steps', description: 'Steps within rule functions' },
    { name: 'Approvals', description: 'Approval workflow for rule transitions' }
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'JWT token in the format: Bearer {token}'
    }
  },
  definitions: {
    Rule: {
      id: 1,
      slug: 'example-rule',
      name: 'Example Rule',
      description: 'An example rule',
      status: 'WIP',
      version_major: 0,
      version_minor: 1,
      author: 'user@example.com',
      created_at: '2026-01-27T00:00:00Z',
      updated_at: '2026-01-27T00:00:00Z'
    },
    RuleFunction: {
      id: 1,
      rule_id: 1,
      code: 'function example() { return true; }',
      return_type: 'boolean',
      input_params: []
    },
    Subfunction: {
      id: 1,
      name: 'Example Function',
      description: 'An example subfunction',
      version: 'v1.0',
      function_name: 'exampleFunction',
      category_id: 'UTIL',
      code: 'function exampleFunction() { return true; }',
      return_type: 'boolean',
      input_params: []
    },
    Category: {
      id: 'UTIL',
      name: 'Utility',
      description: 'Utility functions'
    },
    Error: {
      error: {
        message: 'Error message',
        status: 400
      }
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/routes/index.ts'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);
