import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate, authorize, validate } from '../../middlewares';
import { Permissions } from '../../shared/types';
import {
  dashboardQuerySchema,
  trendsQuerySchema,
  recentActivityQuerySchema,
} from './dashboard.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get overall financial summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Financial summary
 */
router.get(
  '/summary',
  authorize(Permissions.READ_DASHBOARD),
  validate(dashboardQuerySchema, 'query'),
  dashboardController.getSummary
);

/**
 * @swagger
 * /api/dashboard/category-breakdown:
 *   get:
 *     summary: Get category-wise breakdown
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Category breakdown
 */
router.get(
  '/category-breakdown',
  authorize(Permissions.READ_DASHBOARD),
  validate(dashboardQuerySchema, 'query'),
  dashboardController.getCategoryBreakdown
);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Get financial trends over time (Analyst+)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *     responses:
 *       200:
 *         description: Financial trends
 */
router.get(
  '/trends',
  authorize(Permissions.READ_ANALYTICS),
  validate(trendsQuerySchema, 'query'),
  dashboardController.getTrends
);

/**
 * @swagger
 * /api/dashboard/recent-activity:
 *   get:
 *     summary: Get recent financial activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           max: 50
 *     responses:
 *       200:
 *         description: Recent activity
 */
router.get(
  '/recent-activity',
  authorize(Permissions.READ_DASHBOARD),
  validate(recentActivityQuerySchema, 'query'),
  dashboardController.getRecentActivity
);

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get advanced analytics (Analyst+)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Advanced analytics
 */
router.get(
  '/analytics',
  authorize(Permissions.READ_ANALYTICS),
  validate(dashboardQuerySchema, 'query'),
  dashboardController.getAnalytics
);

export default router;
