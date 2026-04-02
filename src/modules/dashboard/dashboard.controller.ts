import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { successResponse } from '../../shared/utils';
import { DashboardQuery, TrendsQuery, RecentActivityQuery } from './dashboard.schema';

export class DashboardController {
  // GET /api/dashboard/summary - Get overall summary
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as DashboardQuery;
      const summary = await dashboardService.getSummary(query);
      
      res.status(200).json(successResponse(summary));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/category-breakdown - Get category-wise breakdown
  async getCategoryBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as DashboardQuery;
      const breakdown = await dashboardService.getCategoryBreakdown(query);
      
      res.status(200).json(successResponse(breakdown));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/trends - Get trends over time
  async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as TrendsQuery;
      const trends = await dashboardService.getTrends(query);
      
      res.status(200).json(successResponse(trends));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/recent-activity - Get recent transactions
  async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as RecentActivityQuery;
      const activity = await dashboardService.getRecentActivity(query);
      
      res.status(200).json(successResponse(activity));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/dashboard/analytics - Get advanced analytics (Analyst+)
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as DashboardQuery;
      const analytics = await dashboardService.getAnalytics(query);
      
      res.status(200).json(successResponse(analytics));
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
