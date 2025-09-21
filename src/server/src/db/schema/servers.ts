import { bigint, pgTable, timestamp } from "drizzle-orm/pg-core";

export const servers = pgTable("servers", {
	serverId: bigint("server_id", { mode: "number" }).notNull().primaryKey(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
