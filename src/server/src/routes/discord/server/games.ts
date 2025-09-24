import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
	getAllTagsInServer,
	getGameThumbnail,
	mapCategoryToGame,
	updateGame,
	updateGameThumbnail,
} from "../../../functions/db.ts";
import { authenticateAndAuthorizeUser } from "../../../functions/discord-bot.ts";

const app = new Hono();

app.post("/:gameId/categories/add", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const category = await mapCategoryToGame({
			gameId: gameId as unknown as number,
			serverId: serverId as string,
			categoryId: body.categoryId as unknown as number,
		});
		return c.json(category, 200);
	}
	return c.json(
		{ message: "User does not have manage server permission." },
		403,
	);
});

// add tags to game
// changes after migration: tags need to be created first in the tags route
app.post("/:gameId/tags/tag", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const existingTags = await getAllTagsInServer({
			serverId: serverId as string,
		});
		const existingTagIds = existingTags.map((tag) => tag.tagId);
		// merge existingTagIds and body.tagIds
		const tagIds = [...existingTagIds, ...(body.tagIds as unknown as number[])];
		// remove duplicates
		const uniqueTagIds = [...new Set(tagIds)];

		const tag = await updateGame({
			gameId: gameId as unknown as number,
			serverId: serverId as string,
			tagIds: uniqueTagIds,
		});
		return c.json(tag, 200);
	}
	return c.json(
		{ message: "User does not have manage server permission." },
		403,
	);
});

app.post("/:gameId/tags/:tagId/untag", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const existingTags = await getAllTagsInServer({
			serverId: serverId as string,
		});
		const existingTagIds = existingTags.map((tag) => tag.tagId);
		// remove body.tagId from existingTagIds
		const newTagIds = existingTagIds.filter(
			(tagId) => tagId !== (body.tagId as unknown as number),
		);
		const tag = await updateGame({
			gameId: gameId as unknown as number,
			serverId: serverId as string,
			tagIds: newTagIds,
		});
		return c.json(tag, 200);
	}
	return c.json(
		{ message: "User does not have manage server permission." },
		403,
	);
});

app.put("/:gameId/thumbnail/update", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const thumbnail = await updateGameThumbnail({
			gameId: gameId as unknown as number,
			serverId: serverId as string,
			thumbnail: body.file as unknown as Buffer,
		});
		return c.json(thumbnail, 200);
	}
	return c.json(
		{ message: "User does not have manage server permission." },
		403,
	);
});

app.get("/:gameId/thumbnail", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const accessToken = getCookie(c, "discord_access_token");
	await authenticateAndAuthorizeUser(serverId as string, accessToken as string);
	const thumbnail = await getGameThumbnail({
		gameId: gameId as unknown as number,
		serverId: serverId as string,
	});
	if (thumbnail) {
		return c.json(thumbnail, 200);
	}
	return c.json({ message: "Thumbnail not found." }, 404);
});
export default app;
