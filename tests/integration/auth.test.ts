import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const app = createApp();
const prisma = new PrismaClient();

describe('Auth API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test@123',
    name: 'Test User',
  };

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup test users
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    afterEach(async () => {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    });

    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'invalid-email' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: '123' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app).post('/api/auth/register').send(testUser);

      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Create test user for login tests
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      await prisma.user.create({
        data: {
          email: testUser.email,
          password: hashedPassword,
          name: testUser.name,
          role: 'VIEWER',
          status: 'ACTIVE',
        },
      });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: testUser.email },
      });
    });

    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
