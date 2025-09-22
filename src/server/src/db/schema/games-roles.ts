import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { games } from "./games.ts";
import { roles } from "./roles.ts";

export const gamesRoles = pgTable(
	"games_roles",
	{
		gameId: integer("game_id")
			.notNull()
			.references(() => games.gameId, { onDelete: "cascade" }),
		roleId: text("role_id")
			.notNull()
			.references(() => roles.roleId, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.roleId] })],
);
