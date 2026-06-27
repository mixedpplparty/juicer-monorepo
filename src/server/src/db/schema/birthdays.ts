import {
	index,
	integer,
	pgTable,
	serial,
	smallint,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { servers } from "./servers.js";

// Global per-user birthday (month + day only). No FK: user identity is global.
export const birthdays = pgTable(
	"birthdays",
	{
		userId: text("user_id").notNull().primaryKey(),
		month: smallint("month").notNull(),
		day: smallint("day").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [index("birthdays_month_day_idx").on(table.month, table.day)],
);

// Idempotency ledger: at most one event + one message per user/server/year.
export const birthdayAnnouncements = pgTable(
	"birthday_announcements",
	{
		id: serial("id").primaryKey(),
		serverId: text("server_id")
			.notNull()
			.references(() => servers.serverId, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		year: integer("year").notNull(),
		discordEventId: text("discord_event_id"),
		announcedAt: timestamp("announced_at"),
	},
	(table) => [
		uniqueIndex("birthday_announcements_server_user_year_idx").on(
			table.serverId,
			table.userId,
			table.year,
		),
	],
);
