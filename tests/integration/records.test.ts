import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = createApp();
const prisma = new PrismaClient();

describe('Records API', () => {
  let adminToken: string;
  let viewerToken: string;
  let adminUser: any;
  let viewerUser: any;

  const generateToken = (user: any) => {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  };

  beforeAll(async () => {
    await prisma.$connect();

    // Create test users
    const hashedPassword = await bcrypt.hash('Test@123', 12);

    adminUser = await prisma.user.create({
      data: {
        email: 'admin-test@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    viewerUser = await prisma.user.create({
      data: {
        email: 'viewer-test@example.com',
        password: hashedPassword,
        name: 'Viewer User',
        role: 'VIEWER',
        status: 'ACTIVE',
      },
    });

    adminToken = generateToken(adminUser);
    viewerToken = generateToken(viewerUser);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.record.deleteMany({
      where: { userId: { in: [adminUser.id, viewerUser.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminUser.id, viewerUser.id] } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/records', () => {
    it('should create a record as admin', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 1000,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
          description: 'Monthly salary',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(1000);
      expect(res.body.data.type).toBe('INCOME');
    });

    it('should reject record creation as viewer', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          amount: 1000,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject record with invalid amount', async () => {
      const res = await request(app)
        .post('/api/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: -100,
          type: 'INCOME',
          category: 'Salary',
          date: new Date().toISOString(),
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/records', () => {
    beforeAll(async () => {
      // Create some test records
      await prisma.record.createMany({
        data: [
          { amount: 5000, type: 'INCOME', category: 'Salary', date: new Date(), userId: adminUser.id },
          { amount: 200, type: 'EXPENSE', category: 'Food', date: new Date(), userId: adminUser.id },
          { amount: 100, type: 'EXPENSE', category: 'Transport', date: new Date(), userId: adminUser.id },
        ],
      });
    });

    it('should get records with pagination', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter records by type', async () => {
      const res = await request(app)
        .get('/api/records')
        .set('Authorization', `Bearer ${viewerToken}`)
        .query({ type: 'INCOME' });

      expect(res.status).toBe(200);
      res.body.data.data.forEach((record: any) => {
        expect(record.type).toBe('INCOME');
      });
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .get('/api/records');

      expect(res.status).toBe(401);
    });
  });
});
