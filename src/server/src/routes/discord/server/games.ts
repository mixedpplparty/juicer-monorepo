import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import {
	AddCategoryToGameRequestBody,
	CreateGameRequestBody,
	ModifyTagsOfGameRequestBody,
	ThumbnailImage,
	type TopicDetails,
	UpdateGameRequestBody,
	UpdateGameThumbnailRequestBody,
} from "juicer-shared/dist/types/index.js";
import {
	createGame,
	deleteGame,
	getGameDetailsInDb,
	getGameThumbnail,
	getRoleInServerInDbByRoleIds,
	getServerDataInDb,
	mapCategoryToGame,
	updateGame,
	updateGameThumbnail,
} from "../../../functions/db.js";
import { authenticateAndAuthorizeUser } from "../../../functions/discord-bot.js";

const app = new Hono();

app.get("/:gameId", async (c) => {
	const serverId = c.req.param("serverId") as string;
	const gameId = Number(c.req.param("gameId"));
	const accessToken = getCookie(c, "discord_access_token");

	if (!Number.isInteger(gameId)) {
		throw new HTTPException(400, { message: "Invalid game ID." });
	}

	const [game, { member }] = await Promise.all([
		getGameDetailsInDb({ serverId, gameId }),
		authenticateAndAuthorizeUser(serverId, accessToken as string, false, false),
	]);

	if (!game) {
		throw new HTTPException(404, { message: "Game not found." });
	}

	const roleIds = game.gamesRoles.map(({ roleId }) => roleId);
	const [roleMetadata, discordRoles, discordChannels] = await Promise.all([
		roleIds.length > 0
			? getRoleInServerInDbByRoleIds({ serverId, roleIds })
			: Promise.resolve([]),
		member.guild.roles.fetch(),
		member.guild.channels.fetch(),
	]);
	const metadataByRoleId = new Map(
		roleMetadata.map((role) => [role.roleId, role]),
	);

	const response: TopicDetails = {
		gameId: game.gameId,
		serverId: game.serverId,
		name: game.name,
		description: game.description ?? null,
		category: game.category ?? null,
		channels: (game.channels ?? []).flatMap((channelId) => {
			const channel = discordChannels.get(channelId);
			return channel ? [{ id: channel.id, name: channel.name }] : [];
		}),
		roles: roleIds.flatMap((roleId) => {
			const role = discordRoles.get(roleId);
			const metadata = metadataByRoleId.get(roleId);
			return role && metadata
				? [
						{
							id: role.id,
							name: role.name,
							color: role.hexColor,
							description: metadata.description,
							selfAssignable: metadata.selfAssignable,
							assigned: member.roles.cache.has(role.id),
						},
					]
				: [];
		}),
	};

	return c.json(response, 200);
});

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
			categoryId: body.categoryId
				? body.categoryId === 0
					? null
					: Number(body.categoryId)
				: null,
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
	const filteredThumbnail = ThumbnailImage.parse(body.thumbnail); //somehow zValidator doesn't work on thumbnail
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
			thumbnail:
				filteredThumbnail !== null && filteredThumbnail !== undefined
					? Buffer.from(await filteredThumbnail.arrayBuffer())
					: null, //optional(not updated if null or undefined)
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
	zValidator("form", UpdateGameThumbnailRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const gameId = c.req.param("gameId");
		const body = await c.req.valid("form");
		const accessToken = getCookie(c, "discord_access_token");
		const { manageGuildPermission } = await authenticateAndAuthorizeUser(
			serverId as string,
			accessToken as string,
			true,
		);
		const filteredThumbnail = ThumbnailImage.parse(body.file); //somehow zValidator doesn't work on thumbnail
		if (manageGuildPermission && filteredThumbnail) {
			const thumbnail = await updateGameThumbnail({
				gameId: Number(gameId),
				serverId: serverId as string,
				thumbnail: Buffer.from(await filteredThumbnail.arrayBuffer()),
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
	// Read-only image fetch hit once per game on the list — don't force a member
	// re-fetch (reuse cache) and don't require manage permission. The forced
	// Discord round-trip here is what made even a 404 take ~10s under load.
	await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		false,
		false,
	);
	const thumbnail = await getGameThumbnail({
		gameId: Number(gameId),
		serverId: serverId as string,
	});
	if (thumbnail) {
		// Let the browser cache thumbnails so it stops refetching them on every
		// navigation. private (responses are per-user/behind auth) + a short max-age
		// so an updated thumbnail goes stale for at most a few minutes.
		c.header("Cache-Control", "private, max-age=300");
		return c.body(Buffer.from(thumbnail), 200);
	}
	throw new HTTPException(404, { message: "Thumbnail not found." });
});
export default app;
