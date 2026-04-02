import { z } from 'zod';

// Dashboard query schema for date range filtering
export const dashboardQuerySchema = z.object({
  startDate: z.string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid start date format')
    .optional(),
  endDate: z.string()
    .refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid end date format')
    .optional(),
});

// Trends query schema
export const trendsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  months: z.coerce.number().int().min(1).max(24).default(6),
});

// Recent activity query schema
export const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
export type RecentActivityQuery = z.infer<typeof recentActivityQuerySchema>;
