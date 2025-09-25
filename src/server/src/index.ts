import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import "dotenv/config";
import { swaggerUI } from "@hono/swagger-ui";
import { every } from "hono/combine";
import { getCookie } from "hono/cookie";
import { rateLimiter } from "hono-rate-limiter";
import authRoutes from "./routes/discord/auth.js";
import serverRoutes from "./routes/discord/server/index.js";
import userRoutes from "./routes/discord/user.js";
import swagger from "./routes/swagger.js";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

const app = new Hono();

// CORS Middleware. Allows requests from ALLOWED_ORIGINS in source root's .env
const corsMiddleware = cors({
	origin: (ALLOWED_ORIGINS ?? "").split(","),
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
	origin: (ALLOWED_ORIGINS ?? "").split(","),
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
app.route("/swagger", swagger);

app.get("/docs", swaggerUI({ url: "/swagger" }));

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
