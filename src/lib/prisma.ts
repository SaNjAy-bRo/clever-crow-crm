import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

const dbUrl = process.env.DATABASE_URL || "";
const isRemote = dbUrl.startsWith("libsql://") || dbUrl.startsWith("https://") || dbUrl.startsWith("http://");

console.log("Runtime DB check: isRemote =", isRemote, "| URL prefix =", dbUrl ? dbUrl.slice(0, 15) : "EMPTY");

let prisma: PrismaClient;

if (isRemote) {
  // Remote Turso Database (LibSQL)
  const token = process.env.TURSO_AUTH_TOKEN;
  const client = createClient({
    url: dbUrl,
    ...(token ? { authToken: token } : {}),
  });
  const adapter = new PrismaLibSql(client as any);
  prisma = new PrismaClient({ adapter });
} else {
  // Local SQLite Database
  const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
  const connectionString = `file:${dbPath}`;
  
  if (process.env.NODE_ENV === "production") {
    const adapter = new PrismaBetterSqlite3({ url: connectionString });
    prisma = new PrismaClient({ adapter });
  } else {
    if (!globalForPrisma.prisma) {
      const adapter = new PrismaBetterSqlite3({ url: connectionString });
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    prisma = globalForPrisma.prisma;
  }
}

export { prisma };
export default prisma;
