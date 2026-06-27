import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { categories } from "./categories.js";
import { games } from "./games.js";
import { roleCategories, roles } from "./roles.js";
import { tags } from "./tags.js";

export const servers = pgTable("servers", {
	serverId: text("server_id").notNull().primaryKey(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	verificationRequired: boolean("verification_required")
		.notNull()
		.default(false),
	birthdayChannelId: text("birthday_channel_id"),
	birthdayTimezone: text("birthday_timezone"),
	birthdayMessageTemplate: text("birthday_message_template"),
	birthdayEventNameTemplate: text("birthday_event_name_template"),
	birthdayEventDescriptionTemplate: text("birthday_event_description_template"),
});

// server -> games, categories, tags, roles, role categories
export const serversRelations = relations(servers, ({ many }) => ({
	games: many(games),
	categories: many(categories),
	tags: many(tags),
	roles: many(roles),
	roleCategories: many(roleCategories),
}));
