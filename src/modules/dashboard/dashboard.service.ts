import { PrismaClient, Prisma } from '@prisma/client';
import { decimalToNumber } from '../../shared/utils';
import { DashboardQuery, TrendsQuery, RecentActivityQuery } from './dashboard.schema';

const prisma = new PrismaClient();

export class DashboardService {
  // Build date filter for queries
  private buildDateFilter(startDate?: string, endDate?: string): Prisma.RecordWhereInput {
    const where: Prisma.RecordWhereInput = { deletedAt: null };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    return where;
  }

  // Get overall dashboard summary
  async getSummary(query: DashboardQuery) {
    const where = this.buildDateFilter(query.startDate, query.endDate);

    // Get totals by type
    const totals = await prisma.record.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Calculate income and expenses
    const incomeData = totals.find((t) => t.type === 'INCOME');
    const expenseData = totals.find((t) => t.type === 'EXPENSE');

    const totalIncome = decimalToNumber(incomeData?._sum.amount) || 0;
    const totalExpenses = decimalToNumber(expenseData?._sum.amount) || 0;
    const netBalance = totalIncome - totalExpenses;
    const incomeCount = incomeData?._count.id || 0;
    const expenseCount = expenseData?._count.id || 0;

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      recordCount: incomeCount + expenseCount,
      incomeCount,
      expenseCount,
      savingsRate: totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(2) : '0.00',
    };
  }

  // Get category-wise breakdown
  async getCategoryBreakdown(query: DashboardQuery) {
    const where = this.buildDateFilter(query.startDate, query.endDate);

    // Get totals by category and type
    const breakdown = await prisma.record.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Get total for each type to calculate percentages
    const typeTotals = await prisma.record.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    });

    const incomeTotalDecimal = typeTotals.find((t) => t.type === 'INCOME')?._sum.amount;
    const expenseTotalDecimal = typeTotals.find((t) => t.type === 'EXPENSE')?._sum.amount;
    const incomeTotal = decimalToNumber(incomeTotalDecimal) || 0;
    const expenseTotal = decimalToNumber(expenseTotalDecimal) || 0;

    // Format breakdown with percentages
    const incomeBreakdown = breakdown
      .filter((b) => b.type === 'INCOME')
      .map((b) => {
        const amount = decimalToNumber(b._sum.amount) || 0;
        return {
          category: b.category,
          type: b.type,
          total: amount,
          count: b._count.id,
          percentage: incomeTotal > 0 ? ((amount / incomeTotal) * 100).toFixed(2) : '0.00',
        };
      })
      .sort((a, b) => b.total - a.total);

    const expenseBreakdown = breakdown
      .filter((b) => b.type === 'EXPENSE')
      .map((b) => {
        const amount = decimalToNumber(b._sum.amount) || 0;
        return {
          category: b.category,
          type: b.type,
          total: amount,
          count: b._count.id,
          percentage: expenseTotal > 0 ? ((amount / expenseTotal) * 100).toFixed(2) : '0.00',
        };
      })
      .sort((a, b) => b.total - a.total);

    return {
      income: incomeBreakdown,
      expense: expenseBreakdown,
      totals: {
        income: incomeTotal,
        expense: expenseTotal,
      },
    };
  }

  // Get monthly/weekly trends
  async getTrends(query: TrendsQuery) {
    const { period, months } = query;

    // Calculate start date based on months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.record.findMany({
      where: {
        deletedAt: null,
        date: { gte: startDate },
      },
      select: {
        amount: true,
        type: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    // Group records by period
    const grouped = new Map<string, { income: number; expenses: number }>();

    records.forEach((record) => {
      let key: string;
      const date = new Date(record.date);

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          key = String(date.getFullYear());
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, { income: 0, expenses: 0 });
      }

      const current = grouped.get(key)!;
      const amount = decimalToNumber(record.amount);

      if (record.type === 'INCOME') {
        current.income += amount;
      } else {
        current.expenses += amount;
      }
    });

    // Convert to array and sort
    const trends = Array.from(grouped.entries())
      .map(([period, data]) => ({
        period,
        income: Math.round(data.income * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        net: Math.round((data.income - data.expenses) * 100) / 100,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    return trends;
  }

  // Get recent activity
  async getRecentActivity(query: RecentActivityQuery) {
    const { limit } = query;

    const records = await prisma.record.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
        description: true,
        createdAt: true,
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return records.map((record) => ({
      ...record,
      amount: decimalToNumber(record.amount),
    }));
  }

  // Get advanced analytics (for Analyst+ roles)
  async getAnalytics(query: DashboardQuery) {
    const where = this.buildDateFilter(query.startDate, query.endDate);

    // Top categories by amount
    const topCategories = await prisma.record.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    // Average transaction amounts
    const averages = await prisma.record.groupBy({
      by: ['type'],
      where,
      _avg: { amount: true },
      _min: { amount: true },
      _max: { amount: true },
    });

    // Records by day of week
    const records = await prisma.record.findMany({
      where,
      select: { date: true, type: true, amount: true },
    });

    const dayOfWeekStats = new Array(7).fill(null).map(() => ({
      income: 0,
      expenses: 0,
      count: 0,
    }));

    records.forEach((record) => {
      const day = new Date(record.date).getDay();
      const amount = decimalToNumber(record.amount);
      dayOfWeekStats[day].count++;
      if (record.type === 'INCOME') {
        dayOfWeekStats[day].income += amount;
      } else {
        dayOfWeekStats[day].expenses += amount;
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayAnalysis = dayOfWeekStats.map((stats, index) => ({
      day: dayNames[index],
      ...stats,
    }));

    return {
      topCategories: topCategories.map((c) => ({
        category: c.category,
        type: c.type,
        total: decimalToNumber(c._sum.amount),
        count: c._count.id,
      })),
      transactionStats: averages.map((a) => ({
        type: a.type,
        average: decimalToNumber(a._avg.amount),
        min: decimalToNumber(a._min.amount),
        max: decimalToNumber(a._max.amount),
      })),
      weekdayAnalysis,
    };
  }
}

export const dashboardService = new DashboardService();
