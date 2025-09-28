import "dotenv/config";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schemas.js";

const pool = new Pool({
	host: process.env.POSTGRES_DB, // fix for ECONNREFUSED error
	port: Number(process.env.POSTGRES_PORT as string),
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: process.env.POSTGRES_DB,
	idleTimeoutMillis: 0,
	allowExitOnIdle: false,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
