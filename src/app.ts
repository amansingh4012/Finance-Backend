import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
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

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Backend API',
      version: '1.0.0',
      description: 'Finance Data Processing and Access Control Backend API',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      ...(config.env === 'production' && process.env.RENDER_EXTERNAL_URL
        ? [{ url: process.env.RENDER_EXTERNAL_URL, description: 'Production server' }]
        : []),
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        CreateRecord: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: {
              type: 'number',
              description: 'Transaction amount (positive)',
            },
            type: {
              type: 'string',
              enum: ['INCOME', 'EXPENSE'],
            },
            category: {
              type: 'string',
              description: 'Transaction category',
            },
            date: {
              type: 'string',
              format: 'date-time',
            },
            description: {
              type: 'string',
              description: 'Optional description',
            },
          },
        },
        UpdateRecord: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            description: { type: 'string' },
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
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Records', description: 'Financial records endpoints' },
      { name: 'Dashboard', description: 'Dashboard and analytics endpoints' },
    ],
  },
  apis: [], // Routes documented inline via swaggerSpec below
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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
