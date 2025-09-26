import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { NameRequiredRequestBody } from "juicer-shared/dist/types/index.js";
import {
	createRoleCategory,
	deleteRoleCategory,
	updateRoleCategoryOfRole,
} from "../../../functions/db.js";
import { authenticateAndAuthorizeUser } from "../../../functions/discord-bot.js";

const app = new Hono();

app.post("/create", zValidator("json", NameRequiredRequestBody), async (c) => {
	const serverId = c.req.param("serverId");
	const body = await c.req.valid("json");
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
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
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
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.post("/:roleCategoryId/assign", async (c) => {
	const serverId = c.req.param("serverId");
	const roleCategoryId = c.req.param("roleCategoryId");
	const body = await c.req.valid("json");
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
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

export default app;
