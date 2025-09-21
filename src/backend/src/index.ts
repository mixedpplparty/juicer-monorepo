import { serve } from "@hono/node-server";
import type { ApiResponse, ServerData } from "@juicer/shared";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// CORS configuration
app.use(
	"*",
	cors({
		origin: process.env.FRONTEND_URL || "http://localhost:8080",
		credentials: true,
	}),
);

// Health check endpoint
app.get("/health", (c) => {
	return c.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Example API endpoint using shared types
app.get("/api/server/:id", async (c) => {
	const serverId = c.req.param("id");

	// This would typically fetch from database
	const serverData: ServerData = {
		server_id: serverId,
		name: "Example Server",
		owner_name: "Owner",
		member_count: 100,
		roles: [],
		role_categories: [],
		categories: [],
		tags: [],
		games: [],
	};

	const response: ApiResponse<ServerData> = {
		success: true,
		data: serverData,
	};

	return c.json(response);
});

app.get("/", (c) => {
	return c.text("Juicer Backend API");
});

const port = 8000;
console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port,
});
