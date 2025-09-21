import { bigint, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { games } from "./games.ts";
import { tags } from "./tags.ts";

export const gamesTags = pgTable(
	"games_tags",
	{
		gameId: bigint("game_id", { mode: "number" })
			.notNull()
			.references(() => games.gameId, { onDelete: "cascade" }),
		tagId: bigint("tag_id", { mode: "number" })
			.notNull()
			.references(() => tags.tagId, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.tagId] })],
);
