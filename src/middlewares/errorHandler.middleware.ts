import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors';
import { errorResponse } from '../shared/utils';
import { config } from '../config';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error in development
  if (config.env === 'development') {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Handle operational errors (expected errors)
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse(
        err.code,
        err.message,
        err.details,
        req.requestId
      )
    );
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    if (prismaError.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json(
        errorResponse(
          'CONFLICT',
          'A record with this value already exists',
          undefined,
          req.requestId
        )
      );
      return;
    }
    
    if (prismaError.code === 'P2025') {
      // Record not found
      res.status(404).json(
        errorResponse(
          'NOT_FOUND',
          'Record not found',
          undefined,
          req.requestId
        )
      );
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json(
      errorResponse(
        'INVALID_TOKEN',
        'Invalid authentication token',
        undefined,
        req.requestId
      )
    );
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json(
      errorResponse(
        'TOKEN_EXPIRED',
        'Authentication token has expired',
        undefined,
        req.requestId
      )
    );
    return;
  }

  // Handle validation errors from express-validator or similar
  if (err.name === 'ValidationError') {
    res.status(422).json(
      errorResponse(
        'VALIDATION_ERROR',
        err.message,
        undefined,
        req.requestId
      )
    );
    return;
  }

  // Handle unexpected errors
  res.status(500).json(
    errorResponse(
      'INTERNAL_ERROR',
      config.env === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      undefined,
      req.requestId
    )
  );
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    errorResponse(
      'NOT_FOUND',
      `Route ${req.method} ${req.path} not found`,
      undefined,
      req.requestId
    )
  );
};
