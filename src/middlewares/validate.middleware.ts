import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../shared/errors';

type ValidationTarget = 'body' | 'query' | 'params';

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

// Format Zod errors into a consistent structure
const formatZodErrors = (error: ZodError): Array<{ field: string; message: string }> => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};

// Validate a single target (body, query, or params)
export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const result = schema.parse(data);
      req[target] = result; // Replace with parsed/transformed data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = formatZodErrors(error);
        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

// Validate multiple targets at once
export const validateRequest = (options: ValidationOptions) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string }> = [];

    try {
      if (options.body) {
        const bodyResult = options.body.safeParse(req.body);
        if (!bodyResult.success) {
          errors.push(...formatZodErrors(bodyResult.error).map(e => ({
            ...e,
            field: `body.${e.field}`,
          })));
        } else {
          req.body = bodyResult.data;
        }
      }

      if (options.query) {
        const queryResult = options.query.safeParse(req.query);
        if (!queryResult.success) {
          errors.push(...formatZodErrors(queryResult.error).map(e => ({
            ...e,
            field: `query.${e.field}`,
          })));
        } else {
          req.query = queryResult.data;
        }
      }

      if (options.params) {
        const paramsResult = options.params.safeParse(req.params);
        if (!paramsResult.success) {
          errors.push(...formatZodErrors(paramsResult.error).map(e => ({
            ...e,
            field: `params.${e.field}`,
          })));
        } else {
          req.params = paramsResult.data;
        }
      }

      if (errors.length > 0) {
        next(new ValidationError('Validation failed', errors));
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
};
