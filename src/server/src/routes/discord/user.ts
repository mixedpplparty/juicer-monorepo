import "dotenv/config";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { getAllServersUserAndBotAreIn } from "../../functions/discord-bot.js";
import { getDiscordOAuthUserData } from "../../functions/discord-oauth.js";

const app = new Hono();

// /discord/user-data is not used anymore as it's duplicate of /discord/user/me
// user.mutual_guilds doesn't exist in discord.js
app.get("/me", async (c) => {
	const accessToken = getCookie(c, "discord_access_token");
	if (!accessToken) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}
	const userData = await getDiscordOAuthUserData(accessToken as string);
	const guilds = await getAllServersUserAndBotAreIn(userData.id);
	return c.json({ userData, guilds });
});

export default app;
