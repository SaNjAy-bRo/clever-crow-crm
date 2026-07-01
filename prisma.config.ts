import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";

// Define an absolute path for the SQLite database so both migrations and runtime use the exact same file.
const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const databaseUrl = `file:${dbPath}`;

console.log("Prisma Config Database URL:", databaseUrl);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: databaseUrl,
  },
});
