import "dotenv/config";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { getAllServersUserAndBotAreIn } from "../../functions/discord-bot.js";
import { editableUntil, isBirthdayEditable } from "../../functions/birthday-core.js";
import { getBirthday, upsertBirthday } from "../../functions/db.js";
import { getDiscordOAuthUserData } from "../../functions/discord-oauth.js";
import { UpdateBirthdayRequestBody } from "juicer-shared/dist/types/index.js";

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

app.get("/me/birthday", async (c) => {
	const accessToken = getCookie(c, "discord_access_token");
	if (!accessToken) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}
	const userData = await getDiscordOAuthUserData(accessToken as string);
	const row = await getBirthday(userData.id);
	if (!row) return c.json(null);
	return c.json({
		month: row.month,
		day: row.day,
		editable: isBirthdayEditable(row.createdAt, Date.now()),
		editableUntil: editableUntil(row.createdAt),
	});
});

app.put(
	"/me/birthday",
	zValidator("json", UpdateBirthdayRequestBody),
	async (c) => {
		const accessToken = getCookie(c, "discord_access_token");
		if (!accessToken) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}
		const userData = await getDiscordOAuthUserData(accessToken as string);
		const body = c.req.valid("json");
		const row = await upsertBirthday({
			userId: userData.id,
			month: body.month,
			day: body.day,
		});
		return c.json({
			month: row.month,
			day: row.day,
			editable: isBirthdayEditable(row.createdAt, Date.now()),
			editableUntil: editableUntil(row.createdAt),
		});
	},
);

export default app;
