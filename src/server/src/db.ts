import "dotenv/config";

import { eq } from "drizzle-orm";
import type {
	CreateGameRequestBody,
	CreateGameResponse,
	CreateServerResponse,
} from "../../shared/dist/index.js";
import { db } from "./db/index.js";
import { games, servers } from "./db/schemas.js";

//TODO return typing
export const getServerDataInDb = async (serverId: string): Promise<unknown> => {
	const serverInfo = await db.query.servers.findFirst({
		where: eq(servers.serverId, serverId),
		with: {
			games: {
				with: {
					gamesTags: true,
					gamesRoles: true,
				},
			},
			categories: true,
			tags: true,
			roles: true,
			roleCategories: true,
		},
	});
	if (!serverInfo) {
		return null;
	}
	return serverInfo;
};

export const createServer = async (
	serverId: string,
): Promise<CreateServerResponse[]> => {
	return await db.insert(servers).values({ serverId }).returning();
};

export const createGame = async ({
	serverId,
	name,
	description,
	categoryId,
}: CreateGameRequestBody): Promise<CreateGameResponse[]> => {
	return await db
		.insert(games)
		.values({ serverId, name, description, categoryId })
		.returning();
};
