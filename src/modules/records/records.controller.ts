import { Request, Response, NextFunction } from 'express';
import { recordsService } from './records.service';
import { successResponse } from '../../shared/utils';
import {
  CreateRecordInput,
  UpdateRecordInput,
  BulkCreateRecordsInput,
  RecordQuery,
} from './records.schema';

export class RecordsController {
  // POST /api/records - Create a new record (admin only)
  async createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateRecordInput;
      const userId = req.user!.userId;
      const record = await recordsService.createRecord(data, userId);
      
      res.status(201).json(successResponse(record, 'Record created successfully'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/records/bulk - Bulk create records (admin only)
  async bulkCreateRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as BulkCreateRecordsInput;
      const userId = req.user!.userId;
      const result = await recordsService.bulkCreateRecords(data, userId);
      
      res.status(201).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/records - Get all records with filters
  async getAllRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as RecordQuery;
      const result = await recordsService.getAllRecords(query);
      
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/records/:id - Get record by ID
  async getRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const record = await recordsService.getRecordById(id);
      
      res.status(200).json(successResponse(record));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/records/:id - Update record (admin only)
  async updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateRecordInput;
      const record = await recordsService.updateRecord(id, data);
      
      res.status(200).json(successResponse(record, 'Record updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/records/:id - Delete record (admin only)
  async deleteRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await recordsService.deleteRecord(id);
      
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/records/categories - Get all predefined categories
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await recordsService.getCategories();
      
      res.status(200).json(successResponse(categories));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/records/categories/used - Get categories used in records
  async getUsedCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await recordsService.getUsedCategories();
      
      res.status(200).json(successResponse(categories));
    } catch (error) {
      next(error);
    }
  }
}

export const recordsController = new RecordsController();
