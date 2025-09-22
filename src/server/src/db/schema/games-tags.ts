import { integer, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { games } from "./games.ts";
import { tags } from "./tags.ts";

export const gamesTags = pgTable(
	"games_tags",
	{
		gameId: integer("game_id")
			.notNull()
			.references(() => games.gameId, { onDelete: "cascade" }),
		tagId: integer("tag_id")
			.notNull()
			.references(() => tags.tagId, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.tagId] })],
);
