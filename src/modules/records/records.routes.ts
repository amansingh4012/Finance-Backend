import { Router } from 'express';
import { recordsController } from './records.controller';
import { authenticate, authorize, validate, validateRequest } from '../../middlewares';
import { Permissions } from '../../shared/types';
import {
  createRecordSchema,
  updateRecordSchema,
  bulkCreateRecordsSchema,
  recordIdParamSchema,
  recordQuerySchema,
} from './records.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/records/categories:
 *   get:
 *     summary: Get all predefined categories
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', recordsController.getCategories);

/**
 * @swagger
 * /api/records/categories/used:
 *   get:
 *     summary: Get categories used in records
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories with usage count
 */
router.get('/categories/used', recordsController.getUsedCategories);

/**
 * @swagger
 * /api/records/bulk:
 *   post:
 *     summary: Bulk create records (Admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - records
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateRecord'
 *     responses:
 *       201:
 *         description: Records created
 */
router.post(
  '/bulk',
  authorize(Permissions.CREATE_RECORDS),
  validate(bulkCreateRecordsSchema),
  recordsController.bulkCreateRecords
);

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new financial record (Admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecord'
 *     responses:
 *       201:
 *         description: Record created
 *       403:
 *         description: Access denied
 */
router.post(
  '/',
  authorize(Permissions.CREATE_RECORDS),
  validate(createRecordSchema),
  recordsController.createRecord
);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: Get all financial records with filters
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
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
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of records
 */
router.get(
  '/',
  authorize(Permissions.READ_RECORDS),
  validate(recordQuerySchema, 'query'),
  recordsController.getAllRecords
);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get record by ID
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Record not found
 */
router.get(
  '/:id',
  authorize(Permissions.READ_RECORDS),
  validate(recordIdParamSchema, 'params'),
  recordsController.getRecordById
);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update record (Admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRecord'
 *     responses:
 *       200:
 *         description: Record updated
 */
router.put(
  '/:id',
  authorize(Permissions.UPDATE_RECORDS),
  validateRequest({ params: recordIdParamSchema, body: updateRecordSchema }),
  recordsController.updateRecord
);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Delete record (Admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Record deleted
 */
router.delete(
  '/:id',
  authorize(Permissions.DELETE_RECORDS),
  validate(recordIdParamSchema, 'params'),
  recordsController.deleteRecord
);

export default router;
