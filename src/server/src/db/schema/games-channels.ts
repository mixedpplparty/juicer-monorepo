import { bigint, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { games } from "./games.js";

export const gamesChannels = pgTable(
	"games_channels",
	{
		gameId: bigint("game_id", { mode: "number" })
			.notNull()
			.references(() => games.gameId, { onDelete: "cascade" }),
		channelId: bigint("channel_id", { mode: "number" }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.channelId] })],
);
