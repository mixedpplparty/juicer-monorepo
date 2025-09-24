import { Hono } from "hono";

const app = new Hono();

const openApiDoc = {
	openapi: "0.0.1",
	info: {
		title: "juicer",
		version: "0.0.1",
		description: "juicer API",
	},
	paths: {
		"/discord": {
			"/auth": {
				"/callback": {
					get: {
						summary: "Callback for Discord OAuth2",
						description:
							"Callback page from to be redirected from https://discord.com/oauth2/authorize",
						parameters: {
							code: {
								type: "string",
								description:
									"Code from Discord OAuth2(should be automatically filled in by Discord)",
								required: true,
							},
						},
						responses: {
							"200": {
								description:
									"Access token and refresh token are set in cookies. Redirected to the page specified in .env.REDIRECT_AFTER_SIGN_IN_URI",
							},
						},
					},
				},
				"/refresh": {
					post: {
						summary: "Refresh Discord OAuth2 token",
						description: "Refresh Discord OAuth2 token",
						responses: {
							"200": {
								description:
									"New access token and refresh token are set in cookies. Redirected to the page specified in .env.REDIRECT_AFTER_SIGN_IN_URI",
							},
						},
					},
				},
				"/revoke": {
					post: {
						summary: "Revoke Discord OAuth2 token('Sign Out')",
						description: "Revoke Discord OAuth2 token('Sign Out')",
						responses: {
							"200": {
								description:
									"Access token and refresh token are deleted from cookies. Redirected to the page specified in .env.REDIRECT_AFTER_SIGN_IN_URI",
							},
						},
					},
				},
			},
			"/user": {
				"/me": {
					get: {
						summary: "Get user data and all servers user and bot are in",
						description: "Get user data and all servers user and bot are in",
					},
					responses: {
						"200": {
							description: "User data and all servers user and bot are in",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											userData: {
												type: "APIUser",
											},
											guilds: {
												type: "array",
												items: {
													type: "Guild",
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
};
app.get("/", (c) => {
	return c.json(openApiDoc);
});

export default app;
