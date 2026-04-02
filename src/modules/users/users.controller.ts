import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { successResponse } from '../../shared/utils';
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateRoleInput,
  UpdateStatusInput,
  UserQuery,
} from './users.schema';

export class UsersController {
  // POST /api/users - Create a new user (admin only)
  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as CreateUserInput;
      const createdById = req.user!.userId;
      const user = await usersService.createUser(data, createdById);
      
      res.status(201).json(successResponse(user, 'User created successfully'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users - Get all users with pagination
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as UserQuery;
      const result = await usersService.getAllUsers(query);
      
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/users/:id - Get user by ID
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);
      
      res.status(200).json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/users/:id - Update user
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateUserInput;
      const requesterId = req.user!.userId;
      const requesterRole = req.user!.role;
      const user = await usersService.updateUser(id, data, requesterId, requesterRole);
      
      res.status(200).json(successResponse(user, 'User updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/users/:id/role - Update user role (admin only)
  async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateRoleInput;
      const requesterId = req.user!.userId;
      const user = await usersService.updateUserRole(id, data, requesterId);
      
      res.status(200).json(successResponse(user, 'User role updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  // PATCH /api/users/:id/status - Update user status (admin only)
  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body as UpdateStatusInput;
      const requesterId = req.user!.userId;
      const user = await usersService.updateUserStatus(id, data, requesterId);
      
      res.status(200).json(successResponse(user, 'User status updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/users/:id - Soft delete user (admin only)
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const requesterId = req.user!.userId;
      const result = await usersService.deleteUser(id, requesterId);
      
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
