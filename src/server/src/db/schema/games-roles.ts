import { bigint, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { games } from "./games.js";
import { roles } from "./roles.js";

export const gamesRoles = pgTable(
	"games_roles",
	{
		gameId: bigint("game_id", { mode: "number" })
			.notNull()
			.references(() => games.gameId, { onDelete: "cascade" }),
		roleId: bigint("role_id", { mode: "number" })
			.notNull()
			.references(() => roles.roleId, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.roleId] })],
);
