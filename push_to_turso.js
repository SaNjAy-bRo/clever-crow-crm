const { createClient } = require('@libsql/client');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || "";

if (!dbUrl || dbUrl.startsWith("file:")) {
  console.error("Error: Please set DATABASE_URL in your .env file to your remote Turso URL starting with libsql://, https://, or http://.");
  process.exit(1);
}

// Extract auth token from URL query param if present, otherwise look in env
let urlObj;
let authToken = "";
try {
  urlObj = new URL(dbUrl);
  authToken = urlObj.searchParams.get("authToken") || "";
} catch (e) {
  console.error("Invalid database URL format:", dbUrl);
  process.exit(1);
}

console.log("Connecting to Turso database:", urlObj.origin);

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function main() {
  console.log("Creating database tables...");
  
  // Drop tables if they exist to ensure a clean slate
  try {
    await client.execute(`DROP TABLE IF EXISTS "ActivityLog"`);
    await client.execute(`DROP TABLE IF EXISTS "Client"`);
    await client.execute(`DROP TABLE IF EXISTS "Whitelist"`);
    console.log("Cleaned up existing tables.");
  } catch (e) {
    console.log("No existing tables to drop.");
  }

  // Create Whitelist table
  await client.execute(`
    CREATE TABLE "Whitelist" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT,
      "role" TEXT NOT NULL DEFAULT 'user',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`CREATE UNIQUE INDEX "Whitelist_email_key" ON "Whitelist"("email")`);
  console.log("✔ Created Whitelist table.");

  // Create Client table
  await client.execute(`
    CREATE TABLE "Client" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "phoneNumber" TEXT NOT NULL,
      "businessName" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "notes" TEXT NOT NULL,
      "serviceDetails" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'lead',
      "value" REAL NOT NULL DEFAULT 0.0,
      "currency" TEXT NOT NULL DEFAULT 'INR',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `);
  console.log("✔ Created Client table.");

  // Create ActivityLog table
  await client.execute(`
    CREATE TABLE "ActivityLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "clientId" TEXT,
      "userEmail" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "details" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ActivityLog_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);
  console.log("✔ Created ActivityLog table.");

  // Seed whitelisted users
  console.log("Seeding whitelisted admin users...");
  const whitelistedUsers = [
    { id: "f8d34bef-966d-41a3-89bd-6f497a9865be", email: "sanjaykumar@gmail.com", name: "Sanjay Kumar", role: "admin" },
    { id: "ee571d75-41e9-408c-bb14-535a5289202b", email: "sanjay@clevercrowstrategies.com", name: "Sanjay Kumar", role: "admin" },
    { id: "dca8c171-49c4-441d-bf1b-b20968e4aadd", email: "admin@clevercrowstrategies.com", name: "Admin User", role: "admin" },
    { id: "d955bf37-66f7-4d22-9283-c7f2331c6885", email: "clevercrowstrategies@gmail.com", name: "Clever Crow Admin", role: "admin" }
  ];

  for (const user of whitelistedUsers) {
    await client.execute({
      sql: `INSERT INTO "Whitelist" (id, email, name, role) VALUES (?, ?, ?, ?)`,
      args: [user.id, user.email, user.name, user.role]
    });
    console.log(`- Whitelisted: ${user.email} (${user.role})`);
  }

  console.log("\n🚀 Turso Database fully initialized and seeded successfully!");
  process.exit(0);
}

main().catch(err => {
  console.error("Database initialization failed:", err);
  process.exit(1);
});
