import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import {
	createGame,
	deleteGame,
	getAllTagsInServer,
	getGameThumbnail,
	mapCategoryToGame,
	updateGame,
	updateGameThumbnail,
} from "../../../functions/db.js";
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
		const game = await createGame({
			serverId: serverId as string,
			name: body.name as string,
			description: body.description as string,
			categoryId: body.categoryId as unknown as number,
		});
		return c.json(game, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.put("/:gameId", async (c) => {
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
		const game = await updateGame({
			gameId: gameId as unknown as number,
			serverId: serverId as string,
			name: body.name as string | null | undefined, // optional(not updated if null or undefined)
			description: body.description as string | null | undefined, // optional(not updated if null or undefined)
			categoryId: body.categoryId as unknown as number | null | undefined, // optional(not updated if null or undefined)
			thumbnail: body.thumbnail as unknown as Buffer | null | undefined, //optional(not updated if null or undefined)
			channels: body.channels as unknown as string[] | null | undefined, // optional(not updated if null or undefined)
			tagIds: body.tagIds as unknown as number[] | null | undefined, // optional(not updated if null or undefined)
			roleIds: body.roleIds as unknown as string[] | null | undefined, // optional(not updated if null or undefined)
		});
		return c.json(game, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.delete("/:gameId", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const game = await deleteGame({
			gameId: gameId as unknown as number,
			serverId: serverId as string,
		});
		return c.json(game, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.post("/:gameId/categories/add", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	if (!body.categoryId) {
		throw new HTTPException(400, {
			message: "field 'categoryId' is required in body.",
		});
	}
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
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

// add tags to game
// changes after migration: tags need to be created first in the tags route
app.post("/:gameId/tags/tag", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	if (!body.tagIds) {
		throw new HTTPException(400, {
			message: "field 'tagIds'(number[]) is required in body.",
		});
	}
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
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
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
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.put("/:gameId/thumbnail/update", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const body = await c.req.parseBody();
	const accessToken = getCookie(c, "discord_access_token");
	if (!body.file) {
		throw new HTTPException(400, {
			message: "field 'file' is required in body.",
		});
	}
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
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
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
	throw new HTTPException(404, { message: "Thumbnail not found." });
});
export default app;
