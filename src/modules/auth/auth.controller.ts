import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { successResponse } from '../../shared/utils';
import { RegisterInput, LoginInput, RefreshTokenInput, ChangePasswordInput } from './auth.schema';

export class AuthController {
  // POST /api/auth/register
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as RegisterInput;
      const result = await authService.register(data);
      
      res.status(201).json(successResponse(result, 'Registration successful'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = req.body as LoginInput;
      const result = await authService.login(data);
      
      res.status(200).json(successResponse(result, 'Login successful'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenInput;
      const tokens = await authService.refreshToken(refreshToken);
      
      res.status(200).json(successResponse(tokens, 'Token refreshed successfully'));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/auth/change-password
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = req.body as ChangePasswordInput;
      const result = await authService.changePassword(userId, data);
      
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/profile
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const profile = await authService.getProfile(userId);
      
      res.status(200).json(successResponse(profile));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
