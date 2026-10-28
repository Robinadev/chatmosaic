import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to connect to the workspace database.");
}

type DatabaseGlobal = typeof globalThis & {
  postgresPool?: Pool;
};

const databaseGlobal = globalThis as DatabaseGlobal;
const pool =
  databaseGlobal.postgresPool ??
  new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });

if (!databaseGlobal.postgresPool) {
  attachDatabasePool(pool);
  if (process.env.NODE_ENV !== "production") {
    databaseGlobal.postgresPool = pool;
  }
}

export { pool };
export const db = drizzle(pool, { schema });
