import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError } from '../../shared/errors';
import { paginationMeta, decimalToNumber } from '../../shared/utils';
import {
  CreateRecordInput,
  UpdateRecordInput,
  BulkCreateRecordsInput,
  RecordQuery,
} from './records.schema';

const prisma = new PrismaClient();

// Transform record to convert Decimal to number
const transformRecord = (record: any) => ({
  ...record,
  amount: decimalToNumber(record.amount),
});

export class RecordsService {
  // Create a new financial record (admin only)
  async createRecord(data: CreateRecordInput, userId: string) {
    const record = await prisma.record.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date(data.date),
        description: data.description,
        userId,
      },
    });

    return transformRecord(record);
  }

  // Bulk create records (admin only)
  async bulkCreateRecords(data: BulkCreateRecordsInput, userId: string) {
    const records = await prisma.record.createMany({
      data: data.records.map((record) => ({
        amount: record.amount,
        type: record.type,
        category: record.category,
        date: new Date(record.date),
        description: record.description,
        userId,
      })),
    });

    return { count: records.count, message: `${records.count} records created successfully` };
  }

  // Get all records with pagination and filters
  async getAllRecords(query: RecordQuery) {
    const {
      page,
      limit,
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.RecordWhereInput = {
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get records and total count
    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.record.count({ where }),
    ]);

    return {
      data: records.map(transformRecord),
      pagination: paginationMeta(page, limit, total),
    };
  }

  // Get record by ID
  async getRecordById(id: string) {
    const record = await prisma.record.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!record) {
      throw new NotFoundError('Record');
    }

    return transformRecord(record);
  }

  // Update record (admin only)
  async updateRecord(id: string, data: UpdateRecordInput) {
    // Check if record exists
    const existingRecord = await prisma.record.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingRecord) {
      throw new NotFoundError('Record');
    }

    // Update record
    const record = await prisma.record.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.type && { type: data.type }),
        ...(data.category && { category: data.category }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return transformRecord(record);
  }

  // Soft delete record (admin only)
  async deleteRecord(id: string) {
    // Check if record exists
    const existingRecord = await prisma.record.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingRecord) {
      throw new NotFoundError('Record');
    }

    // Soft delete
    await prisma.record.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Record deleted successfully' };
  }

  // Get all categories
  async getCategories() {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return categories;
  }

  // Get categories used in records (dynamic)
  async getUsedCategories() {
    const incomeCategories = await prisma.record.groupBy({
      by: ['category'],
      where: { type: 'INCOME', deletedAt: null },
      _count: { category: true },
    });

    const expenseCategories = await prisma.record.groupBy({
      by: ['category'],
      where: { type: 'EXPENSE', deletedAt: null },
      _count: { category: true },
    });

    return {
      income: incomeCategories.map((c) => ({
        name: c.category,
        count: c._count.category,
      })),
      expense: expenseCategories.map((c) => ({
        name: c.category,
        count: c._count.category,
      })),
    };
  }
}

export const recordsService = new RecordsService();
