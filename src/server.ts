import { createApp } from './app';
import { config } from './config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Create and start Express app
  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`
🚀 Finance Backend API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: ${config.env}
🔗 Server:      http://localhost:${config.port}
📚 API Docs:    http://localhost:${config.port}/api/docs
❤️  Health:     http://localhost:${config.port}/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📴 ${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
      console.log('🔌 HTTP server closed');
      
      await prisma.$disconnect();
      console.log('🔌 Database connection closed');
      
      console.log('👋 Goodbye!');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
