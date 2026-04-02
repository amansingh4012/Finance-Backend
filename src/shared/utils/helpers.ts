import { v4 as uuidv4 } from 'uuid';
import { IApiResponse, IApiError } from '../types';

// Generate unique request ID
export const generateRequestId = (): string => {
  return uuidv4();
};

// Format success response
export const successResponse = <T>(data: T, message?: string): IApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
};

// Format error response
export const errorResponse = (
  code: string,
  message: string,
  details?: Array<{ field: string; message: string }>,
  requestId?: string
): IApiError => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
};

// Pagination helper
export const paginationMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// Omit password from user object
export const sanitizeUser = <T extends { password?: string }>(user: T): Omit<T, 'password'> => {
  const { password, ...sanitized } = user;
  return sanitized;
};

// Convert Decimal to number (for Prisma Decimal fields)
export const decimalToNumber = (decimal: any): number => {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return decimal;
  return parseFloat(decimal.toString());
};

// Parse date string to Date object
export const parseDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  return new Date(dateString);
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};
