import { sql } from "drizzle-orm";
import {
	bigint,
	check,
	customType,
	integer,
	pgTable,
	serial,
	text,
	varchar,
} from "drizzle-orm/pg-core";
import { categories } from "./categories.js";
import { servers } from "./servers.js";

const bytea = customType<{
	data: Buffer;
	default: false;
}>({
	dataType() {
		return "bytea";
	},
});

export const games = pgTable(
	"games",
	{
		gameId: serial("game_id").primaryKey(),
		serverId: bigint("server_id", { mode: "number" })
			.notNull()
			.references(() => servers.serverId, { onDelete: "cascade" }),
		categoryId: integer("category_id").references(() => categories.categoryId, {
			onDelete: "set null",
		}),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		thumbnail: bytea("thumbnail"),
	},
	(table) => [
		check("thumbnail_size", sql`octet_length(${table.thumbnail}) <= 1048576`),
	],
);
