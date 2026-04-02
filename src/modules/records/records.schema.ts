import { z } from 'zod';

// Create record schema
export const createRecordSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount exceeds maximum allowed value'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
  }),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters')
    .trim(),
  date: z.string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
});

// Update record schema
export const updateRecordSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount exceeds maximum allowed value')
    .optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters')
    .trim()
    .optional(),
  date: z.string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
});

// Bulk create records schema
export const bulkCreateRecordsSchema = z.object({
  records: z.array(createRecordSchema)
    .min(1, 'At least one record is required')
    .max(100, 'Maximum 100 records per request'),
});

// Record ID parameter schema
export const recordIdParamSchema = z.object({
  id: z.string().uuid('Invalid record ID format'),
});

// Record query schema for listing with filters
export const recordQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
  startDate: z.string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid start date format')
    .optional(),
  endDate: z.string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid end date format')
    .optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['amount', 'date', 'category', 'createdAt', 'type']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type BulkCreateRecordsInput = z.infer<typeof bulkCreateRecordsSchema>;
export type RecordIdParam = z.infer<typeof recordIdParamSchema>;
export type RecordQuery = z.infer<typeof recordQuerySchema>;
