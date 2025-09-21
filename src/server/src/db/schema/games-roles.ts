import { bigint, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { games } from "./games.ts";
import { roles } from "./roles.ts";

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
