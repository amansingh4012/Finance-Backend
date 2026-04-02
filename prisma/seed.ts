import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only)
  await prisma.record.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@finance.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✓ Created admin user:', admin.email);

  // Create analyst user
  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@finance.com',
      password: await bcrypt.hash('Analyst@123', 12),
      name: 'Financial Analyst',
      role: 'ANALYST',
      status: 'ACTIVE',
      createdById: admin.id,
    },
  });
  console.log('✓ Created analyst user:', analyst.email);

  // Create viewer user
  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@finance.com',
      password: await bcrypt.hash('Viewer@123', 12),
      name: 'Dashboard Viewer',
      role: 'VIEWER',
      status: 'ACTIVE',
      createdById: admin.id,
    },
  });
  console.log('✓ Created viewer user:', viewer.email);

  // Create predefined categories
  const incomeCategories = [
    { name: 'Salary', icon: '💰', color: '#22c55e' },
    { name: 'Freelance', icon: '💻', color: '#10b981' },
    { name: 'Investments', icon: '📈', color: '#14b8a6' },
    { name: 'Rental Income', icon: '🏠', color: '#06b6d4' },
    { name: 'Other Income', icon: '💵', color: '#0ea5e9' },
  ];

  const expenseCategories = [
    { name: 'Food & Dining', icon: '🍔', color: '#ef4444' },
    { name: 'Transportation', icon: '🚗', color: '#f97316' },
    { name: 'Utilities', icon: '💡', color: '#f59e0b' },
    { name: 'Entertainment', icon: '🎬', color: '#eab308' },
    { name: 'Healthcare', icon: '🏥', color: '#84cc16' },
    { name: 'Shopping', icon: '🛍️', color: '#a855f7' },
    { name: 'Education', icon: '📚', color: '#6366f1' },
    { name: 'Insurance', icon: '🛡️', color: '#ec4899' },
    { name: 'Other Expenses', icon: '📝', color: '#64748b' },
  ];

  for (const cat of incomeCategories) {
    await prisma.category.create({
      data: { ...cat, type: 'INCOME' },
    });
  }

  for (const cat of expenseCategories) {
    await prisma.category.create({
      data: { ...cat, type: 'EXPENSE' },
    });
  }
  console.log('✓ Created predefined categories');

  // Create sample financial records for the past 6 months
  const now = new Date();
  const sampleRecords = [];

  for (let i = 0; i < 6; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);

    // Monthly salary
    sampleRecords.push({
      amount: 5000 + Math.random() * 500,
      type: 'INCOME' as const,
      category: 'Salary',
      date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      description: `Monthly salary - ${monthDate.toLocaleString('default', { month: 'long' })}`,
      userId: admin.id,
    });

    // Freelance income (random months)
    if (Math.random() > 0.5) {
      sampleRecords.push({
        amount: 500 + Math.random() * 1500,
        type: 'INCOME' as const,
        category: 'Freelance',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
        description: 'Freelance project payment',
        userId: admin.id,
      });
    }

    // Regular expenses
    sampleRecords.push(
      {
        amount: 200 + Math.random() * 100,
        type: 'EXPENSE' as const,
        category: 'Food & Dining',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5),
        description: 'Groceries and dining',
        userId: admin.id,
      },
      {
        amount: 100 + Math.random() * 50,
        type: 'EXPENSE' as const,
        category: 'Utilities',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10),
        description: 'Electricity and water bills',
        userId: admin.id,
      },
      {
        amount: 150 + Math.random() * 100,
        type: 'EXPENSE' as const,
        category: 'Transportation',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 12),
        description: 'Gas and transportation',
        userId: admin.id,
      },
      {
        amount: 50 + Math.random() * 100,
        type: 'EXPENSE' as const,
        category: 'Entertainment',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 20),
        description: 'Movies and subscriptions',
        userId: admin.id,
      }
    );
  }

  // Round amounts to 2 decimal places
  for (const record of sampleRecords) {
    record.amount = Math.round(record.amount * 100) / 100;
  }

  await prisma.record.createMany({
    data: sampleRecords,
  });
  console.log(`✓ Created ${sampleRecords.length} sample financial records`);

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin:   admin@finance.com / Admin@123');
  console.log('  Analyst: analyst@finance.com / Analyst@123');
  console.log('  Viewer:  viewer@finance.com / Viewer@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
