import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import "dotenv/config";
import { every } from "hono/combine";
import { getCookie } from "hono/cookie";
import { rateLimiter } from "hono-rate-limiter";
import authRoutes from "./routes/discord/auth.ts";
import serverRoutes from "./routes/discord/server/index.ts";
import userRoutes from "./routes/discord/user.ts";

const REDIRECT_AFTER_SIGN_IN_URI = process.env.REDIRECT_AFTER_SIGN_IN_URI;
const REDIRECT_AFTER_SIGN_IN_FAILED_URI =
	process.env.REDIRECT_AFTER_SIGN_IN_FAILED_URI;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API_ENDPOINT = process.env.DISCORD_API_ENDPOINT;
const DISCORD_USER_AUTH_URI = process.env.DISCORD_USER_AUTH_URI;
const DISCORD_BOT_INSTALL_URI = process.env.DISCORD_BOT_INSTALL_URI;
const ENVIRONMENT = process.env.ENVIRONMENT;

const app = new Hono();

// CORS Middleware. Allows requests from ALLOWED_ORIGINS in source root's .env
const corsMiddleware = cors({
	origin: (process.env.ALLOWED_ORIGINS ?? "").split(","),
	credentials: true,
	allowMethods: ["GET", "POST", "PUT", "DELETE"],
	allowHeaders: [
		"Accept",
		"Accept-Language",
		"Content-Language",
		"Content-Type",
		"Authorization",
		"X-Requested-With",
	],
});

// CSRF Middleware. Allows requests from Sec-Fetch-Site: same-site(different subdomains allowed)
const csrfMiddleware = csrf({
	origin: (process.env.ALLOWED_ORIGINS ?? "").split(","),
	secFetchSite: "same-site",
});

const rateLimiterMiddleware = rateLimiter({
	windowMs: 60 * 1000, // 1 minute
	limit: 1, // Limit each IP to 1 requests per `window` (here, per 1 minute).
	standardHeaders: "draft-6", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	keyGenerator: (c) =>
		getCookie(c, "discord_access_token") ??
		c.req.header("x-forwarded-for") ??
		(c.req.header("x-real-ip") as string), // get discord_access_token from cookies.
});

app.route("/discord/auth", authRoutes);
app.route("/discord/user", userRoutes);
app.route("/discord/server", serverRoutes);

app.use("*", every(corsMiddleware, csrfMiddleware, rateLimiterMiddleware));

serve(
	{
		fetch: app.fetch,
		port: 8000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
