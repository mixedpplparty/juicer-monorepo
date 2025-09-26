import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createCategory, deleteCategory } from "../../../functions/db.js";
import { authenticateAndAuthorizeUser } from "../../../functions/discord-bot.js";

const app = new Hono();

app.post("/create", async (c) => {
	const serverId = c.req.param("serverId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	if (!body.name) {
		throw new HTTPException(400, {
			message: "field 'name' is required in body.",
		});
	}
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const category = await createCategory({
			serverId: serverId as string,
			name: body.name as string,
		});
		return c.json(category, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.delete("/:categoryId", async (c) => {
	const serverId = c.req.param("serverId");
	const categoryId = c.req.param("categoryId");
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const category = await deleteCategory({
			categoryId: categoryId as unknown as number,
			serverId: serverId as string,
		});
		return c.json(category, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

export default app;
