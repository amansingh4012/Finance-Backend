import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors';
import { Permission, Role, hasPermission, isRoleHigherOrEqual } from '../shared/types';

// Authorization middleware - checks if user has required permission
export const authorize = (...requiredPermissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const userRole = req.user.role as Role;

      // Check if user has ALL required permissions
      const hasAllPermissions = requiredPermissions.every(permission =>
        hasPermission(userRole, permission)
      );

      if (!hasAllPermissions) {
        throw new ForbiddenError('You do not have permission to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Authorization middleware - checks if user has at least one of the required permissions
export const authorizeAny = (...requiredPermissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const userRole = req.user.role as Role;

      // Check if user has ANY of the required permissions
      const hasAnyPermission = requiredPermissions.some(permission =>
        hasPermission(userRole, permission)
      );

      if (!hasAnyPermission) {
        throw new ForbiddenError('You do not have permission to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Authorization middleware - checks if user has minimum role level
export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const userRole = req.user.role as Role;

      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError('Your role does not have access to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Authorization middleware - checks if user has at least the minimum role level
export const requireMinRole = (minRole: Role) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      const userRole = req.user.role as Role;

      if (!isRoleHigherOrEqual(userRole, minRole)) {
        throw new ForbiddenError('Your role does not have access to this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is admin
export const requireAdmin = requireRole(Role.ADMIN);

// Check if user is at least analyst level
export const requireAnalyst = requireMinRole(Role.ANALYST);
