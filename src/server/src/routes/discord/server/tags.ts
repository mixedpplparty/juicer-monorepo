import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import {
	createTag,
	deleteTag,
	getAllTagsInServer,
} from "../../../functions/db.js";
import { authenticateAndAuthorizeUser } from "../../../functions/discord-bot.js";

const app = new Hono();

app.get("/", async (c) => {
	const serverId = c.req.param("serverId");
	const accessToken = getCookie(c, "discord_access_token");
	await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	const tags = await getAllTagsInServer({
		serverId: serverId as string,
	});
	return c.json(tags, 200);
});

app.post("/create", async (c) => {
	const serverId = c.req.param("serverId");
	const body = await c.req.json();
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
		const tag = await createTag({
			serverId: serverId as string,
			name: body.name as string,
		});
		return c.json(tag, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.delete("/:tagId", async (c) => {
	const serverId = c.req.param("serverId");
	const tagId = c.req.param("tagId");
	const accessToken = getCookie(c, "discord_access_token");
	if (!tagId || Number.isNaN(tagId)) {
		throw new HTTPException(400, {
			message: "field 'tagId'(number) is required in params.",
		});
	}
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const tag = await deleteTag({
			tagId: tagId as unknown as number,
			serverId: serverId as string,
		});
		return c.json(tag, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

export default app;
