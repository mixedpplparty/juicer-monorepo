import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
	createRoleCategory,
	deleteRoleCategory,
	updateRoleCategoryOfRole,
} from "../../../functions/db.ts";
import { authenticateAndAuthorizeUser } from "../../../functions/discord-bot.ts";

const app = new Hono();

app.post("/create", async (c) => {
	const serverId = c.req.param("serverId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const roleCategory = await createRoleCategory({
			serverId: serverId as string,
			name: body.name as string,
		});
		return c.json(roleCategory, 200);
	}
	return c.json(
		{ message: "User does not have manage server permission." },
		403,
	);
});

app.delete("/:roleCategoryId", async (c) => {
	const serverId = c.req.param("serverId");
	const roleCategoryId = c.req.param("roleCategoryId");
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const roleCategory = await deleteRoleCategory({
			roleCategoryId: roleCategoryId as unknown as number,
			serverId: serverId as string,
		});
		return c.json(roleCategory, 200);
	}
	return c.json(
		{ message: "User does not have manage server permission." },
		403,
	);
});

app.post("/:roleCategoryId/assign", async (c) => {
	const serverId = c.req.param("serverId");
	const roleCategoryId = c.req.param("roleCategoryId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const roleCategory = await updateRoleCategoryOfRole({
			roleId: body.roleId as string,
			roleCategoryId: roleCategoryId as unknown as number,
			serverId: serverId as string,
		});
		return c.json(roleCategory, 200);
	}
	return c.json(
		{ message: "User does not have manage server permission." },
		403,
	);
});

export default app;
