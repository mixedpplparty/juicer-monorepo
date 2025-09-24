import "dotenv/config";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import {
	exchangeCode,
	refreshAuthToken,
	revokeToken,
} from "../../functions/discord-oauth.ts";

const REDIRECT_AFTER_SIGN_IN_URI = process.env.REDIRECT_AFTER_SIGN_IN_URI;
const REDIRECT_AFTER_SIGN_IN_FAILED_URI =
	process.env.REDIRECT_AFTER_SIGN_IN_FAILED_URI;
const ENVIRONMENT = process.env.ENVIRONMENT;

const app = new Hono();

app.get("/callback", async (c) => {
	const code = c.req.query("code");
	const tokenData = await exchangeCode({ code: code as string });
	const accessToken = tokenData.access_token;
	const refreshToken = tokenData.refresh_token;
	const expiresIn = tokenData.expires_in;
	if (accessToken) {
		setCookie(c, "discord_access_token", accessToken, {
			httpOnly: true,
			sameSite: "Lax",
			secure: ENVIRONMENT === "production",
			maxAge: expiresIn,
		});
	} else {
		return c.redirect(REDIRECT_AFTER_SIGN_IN_FAILED_URI as string);
	}
	if (refreshToken) {
		setCookie(c, "discord_refresh_token", refreshToken, {
			httpOnly: true,
			sameSite: "Lax",
			secure: ENVIRONMENT === "production",
			maxAge: expiresIn,
		});
	}
	return c.redirect(REDIRECT_AFTER_SIGN_IN_URI as string);
});

app.post("/refresh", async (c) => {
	const refreshToken = getCookie(c, "discord_refresh_token");
	const tokenData = await refreshAuthToken(refreshToken as string);
	const accessToken = tokenData.access_token;
	const newRefreshToken = tokenData.refresh_token;
	const expiresIn = tokenData.expires_in;
	if (accessToken) {
		setCookie(c, "discord_access_token", accessToken, {
			httpOnly: true,
			sameSite: "Lax",
			secure: ENVIRONMENT === "production",
			maxAge: expiresIn,
		});
	} else {
		return c.redirect(REDIRECT_AFTER_SIGN_IN_FAILED_URI as string);
	}
	if (newRefreshToken) {
		setCookie(c, "discord_refresh_token", newRefreshToken, {
			httpOnly: true,
			sameSite: "Lax",
			secure: ENVIRONMENT === "production",
			maxAge: expiresIn,
		});
	}
	return c.redirect(REDIRECT_AFTER_SIGN_IN_URI as string);
});

app.post("/revoke", async (c) => {
	const accessToken = getCookie(c, "discord_access_token");
	const refreshToken = getCookie(c, "discord_refresh_token");
	await revokeToken({
		token: accessToken as string,
		token_type_hint: "access_token",
	});
	await revokeToken({
		token: refreshToken as string,
		token_type_hint: "refresh_token",
	});
	deleteCookie(c, "discord_access_token");
	deleteCookie(c, "discord_refresh_token");
	return c.redirect(REDIRECT_AFTER_SIGN_IN_URI as string);
});

app.get("/remove-cookies", async (c) => {
	deleteCookie(c, "discord_access_token");
	deleteCookie(c, "discord_refresh_token");
	return c.json({ detail: "Cookies removed" });
});

export default app;
