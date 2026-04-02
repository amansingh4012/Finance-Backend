import bcrypt from 'bcryptjs';
import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '../../shared/errors';
import { config } from '../../config';
import { paginationMeta } from '../../shared/utils';
import {
  CreateUserInput,
  UpdateUserInput,
  UpdateRoleInput,
  UpdateStatusInput,
  UserQuery,
} from './users.schema';

const prisma = new PrismaClient();

// Exclude password from user select
const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdById: true,
};

export class UsersService {
  // Create a new user (admin only)
  async createUser(data: CreateUserInput, createdById: string) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        role: data.role || 'VIEWER',
        status: 'ACTIVE',
        createdById,
      },
      select: userSelect,
    });

    return user;
  }

  // Get all users with pagination and filters
  async getAllUsers(query: UserQuery) {
    const { page, limit, role, status, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: paginationMeta(page, limit, total),
    };
  }

  // Get user by ID
  async getUserById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...userSelect,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { records: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  // Update user
  async updateUser(id: string, data: UpdateUserInput, requesterId: string, requesterRole: string) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Non-admin users can only update their own profile
    if (requesterRole !== 'ADMIN' && id !== requesterId) {
      throw new BadRequestError('You can only update your own profile');
    }

    // Check email uniqueness if changing email
    if (data.email && data.email.toLowerCase() !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.name && { name: data.name }),
      },
      select: userSelect,
    });

    return user;
  }

  // Update user role (admin only)
  async updateUserRole(id: string, data: UpdateRoleInput, requesterId: string) {
    // Prevent admin from changing their own role
    if (id === requesterId) {
      throw new BadRequestError('You cannot change your own role');
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Update role
    const user = await prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: userSelect,
    });

    return user;
  }

  // Update user status (admin only)
  async updateUserStatus(id: string, data: UpdateStatusInput, requesterId: string) {
    // Prevent admin from deactivating themselves
    if (id === requesterId && data.status === 'INACTIVE') {
      throw new BadRequestError('You cannot deactivate your own account');
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Update status
    const user = await prisma.user.update({
      where: { id },
      data: { status: data.status },
      select: userSelect,
    });

    return user;
  }

  // Soft delete user (admin only)
  async deleteUser(id: string, requesterId: string) {
    // Prevent admin from deleting themselves
    if (id === requesterId) {
      throw new BadRequestError('You cannot delete your own account');
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundError('User');
    }

    // Soft delete user
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'User deleted successfully' };
  }
}

export const usersService = new UsersService();
