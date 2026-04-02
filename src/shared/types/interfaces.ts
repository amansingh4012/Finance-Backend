import { Role, UserStatus } from './enums';

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// User interfaces
export interface IUser extends BaseEntity {
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdById?: string | null;
}

export interface IUserWithPassword extends IUser {
  password: string;
}

export interface ICreateUser {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface IUpdateUser {
  email?: string;
  name?: string;
}

// Financial Record interfaces
export interface IRecord extends BaseEntity {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date;
  description?: string | null;
  userId: string;
}

export interface ICreateRecord {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: string | Date;
  description?: string;
}

export interface IUpdateRecord {
  amount?: number;
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  date?: string | Date;
  description?: string;
}

// Filter & Pagination interfaces
export interface IRecordFilters {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  userId?: string;
}

export interface IPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Dashboard interfaces
export interface IDashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  recordCount: number;
}

export interface ICategoryBreakdown {
  category: string;
  type: 'INCOME' | 'EXPENSE';
  total: number;
  count: number;
  percentage: number;
}

export interface IMonthlyTrend {
  month: string;
  year: number;
  income: number;
  expenses: number;
  net: number;
}

export interface IRecentActivity {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date;
  description?: string | null;
  createdAt: Date;
}

// Auth interfaces
export interface ITokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginResponse {
  user: Omit<IUser, 'createdAt' | 'updatedAt' | 'deletedAt'>;
  tokens: IAuthTokens;
}

// API Response interfaces
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface IApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
  timestamp: string;
  requestId?: string;
}
