import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
	host: process.env.POSTGRES_HOST,
	port: parseInt(process.env.POSTGRES_PORT as string),
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: process.env.POSTGRES_DB,
	idleTimeoutMillis: 0,
	allowExitOnIdle: false,
});

export const db = drizzle({ client: pool });
