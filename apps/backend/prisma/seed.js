import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  // Create admin user with secure password from environment
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'change-me-in-production', 10);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@masterlinc.ai' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@masterlinc.ai',
      name: 'Admin User',
      password: adminPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create test user only in development
  if (process.env.NODE_ENV === 'development') {
    const testPassword = await bcrypt.hash(process.env.TEST_PASSWORD || 'test123456', 10);
    const testUser = await prisma.user.upsert({
      where: { email: 'test@masterlinc.ai' },
      update: {},
      create: {
        email: 'test@masterlinc.ai',
        name: 'Test User',
        password: testPassword,
        role: 'user',
        isActive: true,
        emailVerified: true,
      },
    });

    console.log('✅ Created test user:', testUser.email);

    // Create user preferences for test user
    await prisma.userPreferences.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        language: 'en',
        defaultDomain: 'healthcare',
        theme: 'dark',
      },
    });

    // Create usage stats for test user
    await prisma.usageStats.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        totalMessages: 0,
        totalSessions: 0,
        totalTokens: 0,
      },
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Test Credentials (Development Only):');
    console.log('   Test:  test@masterlinc.ai / test123456');
  } else {
    console.log('✅ Database seeded successfully!');
    console.log('\n📝 Admin user created. Use environment variables for credentials.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
