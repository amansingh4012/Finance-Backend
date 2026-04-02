import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});

// Clear test data after each test suite
afterEach(async () => {
  // Optional: Clear specific tables after tests
  // await prisma.record.deleteMany();
});

// Global test helpers
declare global {
  var testHelpers: {
    prisma: PrismaClient;
    createTestUser: (role?: string) => Promise<any>;
    generateToken: (userId: string, role: string) => string;
  };
}

global.testHelpers = {
  prisma,
  createTestUser: async (role = 'VIEWER') => {
    // Helper to create test users
    return prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: '$2a$12$hashedpassword',
        name: 'Test User',
        role: role as any,
        status: 'ACTIVE',
      },
    });
  },
  generateToken: (userId: string, role: string) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { userId, email: 'test@example.com', role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  },
};
