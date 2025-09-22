import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const servers = pgTable("servers", {
	serverId: text("server_id").notNull().primaryKey(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
