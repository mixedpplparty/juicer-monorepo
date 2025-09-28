import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import {
	AddCategoryToGameRequestBody,
	CreateGameRequestBody,
	ModifyTagsOfGameRequestBody,
	UpdateGameRequestBody,
	UpdateGameThumbnailRequestBody,
} from "juicer-shared/dist/types/index.js";
import {
	createGame,
	deleteGame,
	getGameThumbnail,
	getServerDataInDb,
	mapCategoryToGame,
	updateGame,
	updateGameThumbnail,
} from "../../../functions/db.js";
import { authenticateAndAuthorizeUser } from "../../../functions/discord-bot.js";

const app = new Hono();

app.post("/create", zValidator("json", CreateGameRequestBody), async (c) => {
	const serverId = c.req.param("serverId");
	const body = await c.req.valid("json");
	const accessToken = getCookie(c, "discord_access_token");
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
			categoryId: Number(body.categoryId),
		});
		return c.json(game, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.put("/:gameId", zValidator("json", UpdateGameRequestBody), async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const body = await c.req.valid("json");
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const game = await updateGame({
			gameId: Number(gameId),
			serverId: serverId as string,
			name: body.name as string | null | undefined, // optional(not updated if null or undefined)
			description: body.description as string | null | undefined, // optional(not updated if null or undefined)
			categoryId: body.categoryId as number | null | undefined, // optional(not updated if null or undefined)
			thumbnail: body.thumbnail as Buffer | null | undefined, //optional(not updated if null or undefined)
			channels: body.channels as string[] | null | undefined, // optional(not updated if null or undefined)
			tagIds: body.tagIds as number[] | null | undefined, // optional(not updated if null or undefined)
			roleIds: body.roleIds as string[] | null | undefined, // optional(not updated if null or undefined)
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
			gameId: Number(gameId),
			serverId: serverId as string,
		});
		return c.json(game, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.post(
	"/:gameId/categories/add",
	zValidator("json", AddCategoryToGameRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const gameId = c.req.param("gameId");
		const body = await c.req.valid("json");
		const accessToken = getCookie(c, "discord_access_token");
		const { manageGuildPermission } = await authenticateAndAuthorizeUser(
			serverId as string,
			accessToken as string,
			true,
		);
		if (manageGuildPermission) {
			const category = await mapCategoryToGame({
				gameId: Number(gameId),
				serverId: serverId as string,
				categoryId: Number(body.categoryId),
			});
			return c.json(category, 200);
		}
		throw new HTTPException(403, {
			message: "User does not have manage server permission.",
		});
	},
);

// add tags to game
// changes after migration: tags need to be created first in the tags route
app.post(
	"/:gameId/tags/tag",
	zValidator("json", ModifyTagsOfGameRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const gameId = c.req.param("gameId");
		const body = await c.req.valid("json");
		const accessToken = getCookie(c, "discord_access_token");
		const { manageGuildPermission } = await authenticateAndAuthorizeUser(
			serverId as string,
			accessToken as string,
			true,
		);
		if (manageGuildPermission) {
			const serverDataInDb = await getServerDataInDb(serverId as string);
			const existingTagIds: number[] =
				serverDataInDb?.games
					?.find((game) => game.gameId === Number(gameId))
					?.gamesTags?.map((tag) => tag.tagId) ?? [];
			// merge existingTagIds and body.tagIds
			const tagIds = [...existingTagIds, ...body.tagIds];
			// remove duplicates
			const uniqueTagIds = [...new Set(tagIds)];
			console.log("DEBUG: uniqueTagIds", uniqueTagIds);
			const tag = await updateGame({
				gameId: Number(gameId),
				serverId: serverId as string,
				tagIds: uniqueTagIds,
			});
			return c.json(tag, 200);
		}
		throw new HTTPException(403, {
			message: "User does not have manage server permission.",
		});
	},
);

app.post("/:gameId/tags/:tagId/untag", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const tagId = c.req.param("tagId");
	const accessToken = getCookie(c, "discord_access_token");
	const { manageGuildPermission } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	if (manageGuildPermission) {
		const serverDataInDb = await getServerDataInDb(serverId as string);
		const existingGameTags = serverDataInDb?.games?.find(
			(game) => game.gameId === Number(gameId),
		)?.gamesTags;
		console.log("DEBUG: existingGameTags", existingGameTags);
		const existingGameTagIds: number[] =
			existingGameTags?.map((tag) => tag.tagId) ?? [];

		// check if the tag is actually assigned to this game
		if (!existingGameTagIds.includes(Number(tagId))) {
			throw new HTTPException(404, {
				message: "Tag is not assigned to this game.",
			});
		}

		// remove tagId from the game's current tags
		const newTagIds = existingGameTagIds.filter(
			(existingTagId) => existingTagId !== Number(tagId),
		);
		console.log("DEBUG: newTagIds", newTagIds);
		const tag = await updateGame({
			gameId: Number(gameId),
			serverId: serverId as string,
			tagIds: newTagIds,
		});
		return c.json(tag, 200);
	}
	throw new HTTPException(403, {
		message: "User does not have manage server permission.",
	});
});

app.put(
	"/:gameId/thumbnail/update",
	zValidator("json", UpdateGameThumbnailRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const gameId = c.req.param("gameId");
		const body = await c.req.valid("json");
		const accessToken = getCookie(c, "discord_access_token");
		const { manageGuildPermission } = await authenticateAndAuthorizeUser(
			serverId as string,
			accessToken as string,
			true,
		);
		if (manageGuildPermission) {
			const thumbnail = await updateGameThumbnail({
				gameId: Number(gameId),
				serverId: serverId as string,
				thumbnail: body.file as Buffer,
			});
			return c.json(thumbnail, 200);
		}
		throw new HTTPException(403, {
			message: "User does not have manage server permission.",
		});
	},
);

app.get("/:gameId/thumbnail", async (c) => {
	const serverId = c.req.param("serverId");
	const gameId = c.req.param("gameId");
	const accessToken = getCookie(c, "discord_access_token");
	await authenticateAndAuthorizeUser(serverId as string, accessToken as string);
	const thumbnail = await getGameThumbnail({
		gameId: Number(gameId),
		serverId: serverId as string,
	});
	if (thumbnail) {
		return c.json(thumbnail, 200);
	}
	throw new HTTPException(404, { message: "Thumbnail not found." });
});
export default app;
