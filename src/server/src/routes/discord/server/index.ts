import "dotenv/config";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { UpdateServerVerificationRequiredRequestBody } from "juicer-shared/dist/types/index.js";
import {
	createRoleCategory,
	createServer,
	getServerDataInDb,
	updateServerVerificationRequired,
} from "../../../functions/db.js";
import {
	authenticateAndAuthorizeUser,
	getGuildAndMemberData,
	syncRolesWithDbAndDiscord,
} from "../../../functions/discord-bot.js";
import categoriesRoutes from "./categories.js";
import gamesRoutes from "./games.js";
import roleCategoriesRoutes from "./role-categories.js";
import rolesRoutes from "./roles.js";
import searchRoutes from "./search.js";
import tagsRoutes from "./tags.js";

const app = new Hono();

// Get server data
app.get("/:serverId", async (c) => {
	const serverId = c.req.param("serverId");
	const accessToken = getCookie(c, "discord_access_token");
	const { guild, manageGuildPermission } = await getGuildAndMemberData(
		serverId,
		accessToken as string,
	);
	const serverDataDb = await getServerDataInDb(serverId);
	return c.json({
		admin: manageGuildPermission,
		serverDataDb,
		serverDataDiscord: guild,
	});
});

// Admin required
// Create server
app.post("/:serverId/create", async (c) => {
	const serverId = c.req.param("serverId");
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const serverDataDb = await createServer(serverId);
		//verification is always ID 1
		const verificationRoleCategory = await createRoleCategory({
			serverId,
			name: "verification",
		});
		if (serverDataDb && verificationRoleCategory) {
			return c.json(
				{
					message: "Server created. Roles need to be synced.",
				},
				200,
			);
		}
		throw new HTTPException(500, {
			message: "Failed to create server or verification role category.",
		});
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

// Get my data in server
app.get("/:serverId/me", async (c) => {
	const serverId = c.req.param("serverId");
	const accessToken = getCookie(c, "discord_access_token");
	const { member } = await authenticateAndAuthorizeUser(
		serverId,
		accessToken as string,
	);
	return c.json(member);
});

// Admin required
// Sync roles with DB and Discord
app.get("/:serverId/sync-roles", async (c) => {
	const serverId = c.req.param("serverId");
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const diff = await syncRolesWithDbAndDiscord(serverId);
		return c.json(diff);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.put(
	"/:serverId",
	zValidator("json", UpdateServerVerificationRequiredRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const body = await c.req.valid("json");
		const accessToken = getCookie(c, "discord_access_token");
		const { manageGuildPermission } = await authenticateAndAuthorizeUser(
			serverId,
			accessToken as string,
			true,
		);
		if (manageGuildPermission) {
			const server = await updateServerVerificationRequired({
				serverId: serverId as string,
				verificationRequired: body.verificationRequired,
			});
			return c.json(server, 200);
		}
		throw new HTTPException(403, {
			message: "User does not have manage server permission.",
		});
	},
);

app.route("/:serverId/categories", categoriesRoutes);
app.route("/:serverId/games", gamesRoutes);
app.route("/:serverId/role-categories", roleCategoriesRoutes);
app.route("/:serverId/roles", rolesRoutes);
app.route("/:serverId/search", searchRoutes);
app.route("/:serverId/tags", tagsRoutes);

export default app;
