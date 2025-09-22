import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { games } from "./games.ts";

export const gamesChannels = pgTable(
	"games_channels",
	{
		gameId: integer("game_id")
			.notNull()
			.references(() => games.gameId, { onDelete: "cascade" }),
		channelId: text("channel_id").notNull(),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.channelId] })],
);
