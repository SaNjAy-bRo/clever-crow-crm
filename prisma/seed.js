const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

// Resolve the absolute path to the SQLite database file
const dbPath = path.resolve(process.cwd(), 'prisma/dev.db');
const connectionString = `file:${dbPath}`;
console.log('Seed script absolute connection string:', connectionString);

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const emails = [
    { email: 'sanjaykumar@gmail.com', name: 'Sanjay Kumar', role: 'admin' },
    { email: 'sanjay@clevercrowstrategies.com', name: 'Sanjay Kumar', role: 'admin' },
    { email: 'admin@clevercrowstrategies.com', name: 'Admin User', role: 'admin' },
    { email: 'clevercrowstrategies@gmail.com', name: 'Clever Crow Admin', role: 'admin' }
  ];

  console.log('Seeding whitelisted users...');

  for (const item of emails) {
    const user = await prisma.whitelist.upsert({
      where: { email: item.email },
      update: {},
      create: {
        email: item.email,
        name: item.name,
        role: item.role,
      },
    });
    console.log(`- Whitelisted: ${user.email} (${user.role})`);
  }

  // Create a dummy client to start with
  const clientCount = await prisma.client.count();
  if (clientCount === 0) {
    const dummyClient = await prisma.client.create({
      data: {
        name: 'John Doe',
        phoneNumber: '+1 (555) 019-2834',
        businessName: 'Acme Corp',
        address: '123 Enterprise Way, Suite 500, Innovation City',
        notes: 'Initial contact via website form. Interested in full branding and SEO strategy.',
        serviceDetails: 'Branding, SEO & Marketing Campaign',
        status: 'active',
        value: 12500.0,
        activities: {
          create: [
            {
              userEmail: 'system',
              action: 'Created Client',
              details: 'Initial system seeding.',
            }
          ]
        }
      }
    });
    console.log(`Seeded initial client: ${dummyClient.name} (${dummyClient.businessName})`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
