import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import {
  errorHandler,
  notFoundHandler,
  requestId,
  requestLogger,
} from './middlewares';

// Import routes
import { authRoutes } from './modules/auth';
import { usersRoutes } from './modules/users';
import { recordsRoutes } from './modules/records';
import { dashboardRoutes } from './modules/dashboard';

// Swagger specification - defined inline for production compatibility
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Finance Backend API',
    version: '1.0.0',
    description: 'Finance Data Processing and Access Control Backend API - A comprehensive backend for managing financial records with role-based access control.',
  },
  servers: [
    {
      url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${config.port}`,
      description: config.env === 'production' ? 'Production server' : 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token obtained from /api/auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Record: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          amount: { type: 'number' },
          type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          category: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          description: { type: 'string' },
          userId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication - Register, Login, Token Refresh' },
    { name: 'Users', description: 'User Management - CRUD operations (Admin only for write)' },
    { name: 'Records', description: 'Financial Records - Income/Expense tracking' },
    { name: 'Dashboard', description: 'Analytics - Summary, Trends, Category Breakdown' },
  ],
  paths: {
    // AUTH ENDPOINTS
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 8, example: 'Password@123' },
                  name: { type: 'string', example: 'John Doe' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully' },
          '409': { description: 'Email already exists' },
          '422': { description: 'Validation error' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and get JWT tokens',
        description: 'Returns access token (24h) and refresh token (7d)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@finance.com' },
                  password: { type: 'string', example: 'Admin@123' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        tokens: {
                          type: 'object',
                          properties: {
                            accessToken: { type: 'string' },
                            refreshToken: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'New tokens generated' },
          '401': { description: 'Invalid refresh token' },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User profile' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed' },
          '400': { description: 'Current password incorrect' },
        },
      },
    },

    // USERS ENDPOINTS
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users (Analyst, Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] } },
        ],
        responses: {
          '200': { description: 'List of users with pagination' },
          '403': { description: 'Forbidden - Insufficient permissions' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a new user (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created' },
          '403': { description: 'Admin only' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'User details' },
          '404': { description: 'User not found' },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'User updated' },
          '403': { description: 'Admin only' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user - soft delete (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'User deleted' },
          '403': { description: 'Admin only' },
        },
      },
    },
    '/api/users/{id}/role': {
      patch: {
        tags: ['Users'],
        summary: 'Change user role (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Role updated' },
        },
      },
    },
    '/api/users/{id}/status': {
      patch: {
        tags: ['Users'],
        summary: 'Change user status (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Status updated' },
        },
      },
    },

    // RECORDS ENDPOINTS
    '/api/records': {
      get: {
        tags: ['Records'],
        summary: 'Get all financial records',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'List of records with pagination' },
        },
      },
      post: {
        tags: ['Records'],
        summary: 'Create a financial record (Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount', 'type', 'category', 'date'],
                properties: {
                  amount: { type: 'number', example: 5000 },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'INCOME' },
                  category: { type: 'string', example: 'Salary' },
                  date: { type: 'string', format: 'date-time', example: '2024-01-15' },
                  description: { type: 'string', example: 'Monthly salary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Record created' },
          '403': { description: 'Admin only' },
        },
      },
    },
    '/api/records/{id}': {
      get: {
        tags: ['Records'],
        summary: 'Get record by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Record details' },
          '404': { description: 'Not found' },
        },
      },
      put: {
        tags: ['Records'],
        summary: 'Update record (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
                  category: { type: 'string' },
                  date: { type: 'string', format: 'date-time' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Record updated' },
        },
      },
      delete: {
        tags: ['Records'],
        summary: 'Delete record - soft delete (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Record deleted' },
        },
      },
    },

    // DASHBOARD ENDPOINTS
    '/api/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get financial summary',
        description: 'Returns total income, expenses, net balance, and counts',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'Financial summary',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalIncome: { type: 'number' },
                        totalExpenses: { type: 'number' },
                        netBalance: { type: 'number' },
                        recordCount: { type: 'integer' },
                        savingsRate: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/dashboard/category-breakdown': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get category-wise breakdown',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Category breakdown with totals and percentages' },
        },
      },
    },
    '/api/dashboard/trends': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get monthly/weekly trends (Analyst, Admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['weekly', 'monthly'], default: 'monthly' } },
          { name: 'months', in: 'query', schema: { type: 'integer', default: 6 } },
        ],
        responses: {
          '200': { description: 'Trend data over time' },
        },
      },
    },
    '/api/dashboard/analytics': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get comprehensive analytics (Analyst, Admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Detailed analytics including top categories, recent activity' },
        },
      },
    },
  },
};

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.env === 'production' 
      ? process.env.ALLOWED_ORIGINS?.split(',') 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request tracking
  app.use(requestId);
  if (config.env === 'development') {
    app.use(requestLogger);
  }

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.env,
    });
  });

  // API Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Finance API Documentation',
  }));

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/records', recordsRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
