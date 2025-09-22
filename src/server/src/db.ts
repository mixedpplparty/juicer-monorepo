import "dotenv/config";

import { eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { servers } from "./db/schemas.js";

export const getServerDataInDb = async (serverId: string): Promise<unknown> => {
	const serverData = await db.query.servers.findFirst({
		where: eq(servers.serverId, serverId),
	});
	return serverData;
};
