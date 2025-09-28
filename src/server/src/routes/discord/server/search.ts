import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
	findGamesByCategoryName,
	findGamesByName,
	findGamesByTags,
	getAllGamesInServer,
} from "../../../functions/db.js";
import { authenticateAndAuthorizeUser } from "../../../functions/discord-bot.js";

const app = new Hono();

app.get("/all", async (c) => {
	const serverId = c.req.param("serverId");
	const query = c.req.query("query");
	const accessToken = getCookie(c, "discord_access_token");
	await authenticateAndAuthorizeUser(serverId as string, accessToken as string);
	if (!query) {
		// all games
		const games = await getAllGamesInServer({
			serverId: serverId as string,
		});
		return c.json(games, 200);
	}
	const gamesByName = await findGamesByName({
		serverId: serverId as string,
		name: query as string,
	});
	const gamesByTags = await findGamesByTags({
		serverId: serverId as string,
		tagNames: [query as string],
	});
	const gamesByCategories = await findGamesByCategoryName({
		serverId: serverId as string,
		categoryName: query as string,
	});
	const games = [...gamesByName, ...gamesByTags, ...gamesByCategories];
	const seenIds = new Set();
	const uniqueGames = games.filter((game) => {
		if (seenIds.has(game.gameId)) {
			return false;
		}
		seenIds.add(game.gameId);
		return true;
	});
	return c.json(uniqueGames, 200);
});
export default app;
