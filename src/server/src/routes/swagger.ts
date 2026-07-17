import { Hono } from "hono";

const app = new Hono();

const json = (schema: object) => ({
	"application/json": { schema },
});

const success = (description: string, schema: object = { type: "object" }) => ({
	description,
	content: json(schema),
});

const serverIdParameter = {
	$ref: "#/components/parameters/ServerId",
};

const openApiDoc = {
	openapi: "3.0.3",
	info: {
		title: "juicer API",
		version: "0.0.1",
		description:
			"Discord-integrated server, game, role, and tag management API.",
	},
	tags: [
		{ name: "Auth" },
		{ name: "Users" },
		{ name: "Servers" },
		{ name: "Categories" },
		{ name: "Games" },
		{ name: "Role categories" },
		{ name: "Roles" },
		{ name: "Search" },
		{ name: "Tags" },
	],
	paths: {
		"/discord/auth/me": {
			get: {
				tags: ["Auth"],
				operationId: "getAuthenticatedUser",
				summary: "Get the authenticated Discord user",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Authenticated Discord user.", {
						type: "object",
						required: ["userData"],
						properties: {
							userData: { $ref: "#/components/schemas/DiscordUser" },
						},
					}),
					"401": { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/discord/auth/callback": {
			get: {
				tags: ["Auth"],
				operationId: "discordOAuthCallback",
				summary: "Complete Discord OAuth",
				parameters: [
					{
						name: "code",
						in: "query",
						required: true,
						description: "Authorization code supplied by Discord.",
						schema: { type: "string" },
					},
				],
				responses: {
					"302": {
						description:
							"Authentication cookies are set and the browser is redirected.",
					},
				},
			},
		},
		"/discord/auth/refresh": {
			post: {
				tags: ["Auth"],
				operationId: "refreshDiscordToken",
				summary: "Refresh Discord OAuth tokens",
				security: [{ RefreshTokenCookie: [] }],
				responses: {
					"302": {
						description:
							"Replacement cookies are set and the browser is redirected.",
					},
				},
			},
		},
		"/discord/auth/revoke": {
			post: {
				tags: ["Auth"],
				operationId: "revokeDiscordTokens",
				summary: "Sign out and revoke Discord OAuth tokens",
				security: [{ AccessTokenCookie: [], RefreshTokenCookie: [] }],
				responses: {
					"302": {
						description:
							"Authentication cookies are removed and the browser is redirected.",
					},
				},
			},
		},
		"/discord/auth/remove-cookies": {
			get: {
				tags: ["Auth"],
				operationId: "removeAuthCookies",
				summary: "Remove local authentication cookies",
				responses: {
					"200": success("Cookies removed.", {
						$ref: "#/components/schemas/Detail",
					}),
				},
			},
		},
		"/discord/user/me": {
			get: {
				tags: ["Users"],
				operationId: "getCurrentUserAndGuilds",
				summary: "Get the current user and mutual Discord servers",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Current user and mutual servers.", {
						type: "object",
						required: ["userData", "guilds"],
						properties: {
							userData: { $ref: "#/components/schemas/DiscordUser" },
							guilds: {
								type: "array",
								items: { $ref: "#/components/schemas/DiscordGuild" },
							},
						},
					}),
					"401": { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/discord/servers/{serverId}": {
			parameters: [serverIdParameter],
			get: {
				tags: ["Servers"],
				operationId: "getServer",
				summary: "Get combined database and Discord server data",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Combined server data.", {
						$ref: "#/components/schemas/ServerData",
					}),
					"401": { $ref: "#/components/responses/Unauthorized" },
				},
			},
			put: {
				tags: ["Servers"],
				operationId: "updateServer",
				summary: "Update server verification requirements",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({
						$ref: "#/components/schemas/UpdateServerRequest",
					}),
				},
				responses: {
					"200": success("Updated server.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/create": {
			parameters: [serverIdParameter],
			post: {
				tags: ["Servers"],
				operationId: "createServer",
				summary: "Create server data",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Server created.", {
						$ref: "#/components/schemas/Message",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/me": {
			parameters: [serverIdParameter],
			get: {
				tags: ["Servers"],
				operationId: "getCurrentServerMember",
				summary: "Get the current member in a server",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Current server member.", {
						$ref: "#/components/schemas/GuildMember",
					}),
					"401": { $ref: "#/components/responses/Unauthorized" },
				},
			},
		},
		"/discord/servers/{serverId}/sync-roles": {
			parameters: [serverIdParameter],
			get: {
				tags: ["Servers"],
				operationId: "syncServerRoles",
				summary: "Synchronize Discord roles with the database",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Role synchronization diff.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/categories/create": {
			parameters: [serverIdParameter],
			post: {
				tags: ["Categories"],
				operationId: "createCategory",
				summary: "Create a game category",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({ $ref: "#/components/schemas/NameRequest" }),
				},
				responses: {
					"200": success("Created category.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/categories/{categoryId}": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/CategoryId" },
			],
			delete: {
				tags: ["Categories"],
				operationId: "deleteCategory",
				summary: "Delete a game category",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Deleted category.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/games/create": {
			parameters: [serverIdParameter],
			post: {
				tags: ["Games"],
				operationId: "createGame",
				summary: "Create a game",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({ $ref: "#/components/schemas/CreateGameRequest" }),
				},
				responses: {
					"200": success("Created game.", {
						$ref: "#/components/schemas/Game",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/games/{gameId}": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/GameId" },
			],
			put: {
				tags: ["Games"],
				operationId: "updateGame",
				summary: "Update a game",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({ $ref: "#/components/schemas/UpdateGameRequest" }),
				},
				responses: {
					"200": success("Updated game.", {
						$ref: "#/components/schemas/Game",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
			delete: {
				tags: ["Games"],
				operationId: "deleteGame",
				summary: "Delete a game",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Deleted game.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/games/{gameId}/categories/add": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/GameId" },
			],
			post: {
				tags: ["Games"],
				operationId: "addCategoryToGame",
				summary: "Assign a category to a game",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({
						type: "object",
						required: ["categoryId"],
						properties: { categoryId: { type: "integer" } },
					}),
				},
				responses: {
					"200": success("Category assigned.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/games/{gameId}/tags/tag": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/GameId" },
			],
			post: {
				tags: ["Games"],
				operationId: "tagGame",
				summary: "Add tags to a game",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({
						type: "object",
						required: ["tagIds"],
						properties: {
							tagIds: {
								type: "array",
								items: { type: "integer" },
							},
						},
					}),
				},
				responses: {
					"200": success("Tags added.", {
						$ref: "#/components/schemas/Game",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/games/{gameId}/tags/{tagId}/untag": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/GameId" },
				{ $ref: "#/components/parameters/TagId" },
			],
			post: {
				tags: ["Games"],
				operationId: "untagGame",
				summary: "Remove a tag from a game",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Tag removed.", {
						$ref: "#/components/schemas/Game",
					}),
					"404": { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/discord/servers/{serverId}/games/{gameId}/thumbnail/update": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/GameId" },
			],
			put: {
				tags: ["Games"],
				operationId: "updateGameThumbnail",
				summary: "Upload a game thumbnail",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: {
						"multipart/form-data": {
							schema: {
								type: "object",
								required: ["file"],
								properties: {
									file: { type: "string", format: "binary" },
								},
							},
						},
					},
				},
				responses: {
					"200": success("Thumbnail updated.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/games/{gameId}/thumbnail": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/GameId" },
			],
			get: {
				tags: ["Games"],
				operationId: "getGameThumbnail",
				summary: "Get a game thumbnail",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": {
						description: "Thumbnail image.",
						content: {
							"application/octet-stream": {
								schema: { type: "string", format: "binary" },
							},
						},
					},
					"404": { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/discord/servers/{serverId}/role-categories/create": {
			parameters: [serverIdParameter],
			post: {
				tags: ["Role categories"],
				operationId: "createRoleCategory",
				summary: "Create a role category",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({ $ref: "#/components/schemas/NameRequest" }),
				},
				responses: {
					"200": success("Created role category.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/role-categories/{roleCategoryId}": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/RoleCategoryId" },
			],
			delete: {
				tags: ["Role categories"],
				operationId: "deleteRoleCategory",
				summary: "Delete a role category",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Deleted role category.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"400": { $ref: "#/components/responses/BadRequest" },
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/role-categories/assign": {
			parameters: [serverIdParameter],
			post: {
				tags: ["Role categories"],
				operationId: "assignRoleCategory",
				summary: "Assign a category to a role",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({
						$ref: "#/components/schemas/AssignRoleCategoryRequest",
					}),
				},
				responses: {
					"200": success("Role category assigned.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/roles": {
			parameters: [serverIdParameter],
			get: {
				tags: ["Roles"],
				operationId: "getServerRoles",
				summary: "Get server roles and the current member's roles",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Server and member roles.", {
						type: "object",
						required: ["serverRoles", "myRoles"],
						properties: {
							serverRoles: {
								type: "array",
								items: { $ref: "#/components/schemas/GenericObject" },
							},
							myRoles: {
								type: "array",
								items: { type: "string" },
							},
						},
					}),
				},
			},
		},
		"/discord/servers/{serverId}/roles/{roleId}/assign": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/RoleId" },
			],
			post: {
				tags: ["Roles"],
				operationId: "assignRole",
				summary: "Assign a self-assignable role to the current member",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Role assigned.", {
						$ref: "#/components/schemas/Message",
					}),
					"400": { $ref: "#/components/responses/BadRequest" },
					"404": { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/discord/servers/{serverId}/roles/{roleId}/unassign": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/RoleId" },
			],
			post: {
				tags: ["Roles"],
				operationId: "unassignRole",
				summary: "Remove a self-assignable role from the current member",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Role removed.", {
						$ref: "#/components/schemas/Message",
					}),
					"400": { $ref: "#/components/responses/BadRequest" },
					"404": { $ref: "#/components/responses/NotFound" },
				},
			},
		},
		"/discord/servers/{serverId}/roles/{roleId}/update": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/RoleId" },
			],
			post: {
				tags: ["Roles"],
				operationId: "updateRole",
				summary: "Update role metadata",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({ $ref: "#/components/schemas/UpdateRoleRequest" }),
				},
				responses: {
					"200": success("Updated role.", {
						$ref: "#/components/schemas/GenericObject",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/search/all": {
			parameters: [
				serverIdParameter,
				{
					name: "query",
					in: "query",
					required: false,
					description: "Game name, tag, or category. Omit to return all games.",
					schema: { type: "string" },
				},
			],
			get: {
				tags: ["Search"],
				operationId: "searchGames",
				summary: "Search games in a server",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Matching games.", {
						type: "array",
						items: { $ref: "#/components/schemas/Game" },
					}),
				},
			},
		},
		"/discord/servers/{serverId}/tags": {
			parameters: [serverIdParameter],
			get: {
				tags: ["Tags"],
				operationId: "getServerTags",
				summary: "Get all tags in a server",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Server tags.", {
						type: "array",
						items: { $ref: "#/components/schemas/Tag" },
					}),
				},
			},
		},
		"/discord/servers/{serverId}/tags/create": {
			parameters: [serverIdParameter],
			post: {
				tags: ["Tags"],
				operationId: "createTag",
				summary: "Create a tag",
				security: [{ AccessTokenCookie: [] }],
				requestBody: {
					required: true,
					content: json({ $ref: "#/components/schemas/NameRequest" }),
				},
				responses: {
					"200": success("Created tag.", {
						$ref: "#/components/schemas/Tag",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
		"/discord/servers/{serverId}/tags/{tagId}": {
			parameters: [
				serverIdParameter,
				{ $ref: "#/components/parameters/TagId" },
			],
			delete: {
				tags: ["Tags"],
				operationId: "deleteTag",
				summary: "Delete a tag",
				security: [{ AccessTokenCookie: [] }],
				responses: {
					"200": success("Deleted tag.", {
						$ref: "#/components/schemas/Tag",
					}),
					"403": { $ref: "#/components/responses/Forbidden" },
				},
			},
		},
	},
	components: {
		securitySchemes: {
			AccessTokenCookie: {
				type: "apiKey",
				in: "cookie",
				name: "discord_access_token",
			},
			RefreshTokenCookie: {
				type: "apiKey",
				in: "cookie",
				name: "discord_refresh_token",
			},
		},
		parameters: {
			ServerId: {
				name: "serverId",
				in: "path",
				required: true,
				description: "Discord server ID.",
				schema: { type: "string" },
			},
			CategoryId: {
				name: "categoryId",
				in: "path",
				required: true,
				schema: { type: "integer" },
			},
			GameId: {
				name: "gameId",
				in: "path",
				required: true,
				schema: { type: "integer" },
			},
			RoleCategoryId: {
				name: "roleCategoryId",
				in: "path",
				required: true,
				schema: { type: "integer" },
			},
			RoleId: {
				name: "roleId",
				in: "path",
				required: true,
				description: "Discord role ID.",
				schema: { type: "string" },
			},
			TagId: {
				name: "tagId",
				in: "path",
				required: true,
				schema: { type: "integer" },
			},
		},
		responses: {
			BadRequest: {
				description: "Bad request.",
				content: json({ $ref: "#/components/schemas/Error" }),
			},
			Unauthorized: {
				description: "Authentication is required.",
				content: json({ $ref: "#/components/schemas/Error" }),
			},
			Forbidden: {
				description: "Manage Server permission is required.",
				content: json({ $ref: "#/components/schemas/Error" }),
			},
			NotFound: {
				description: "The requested resource was not found.",
				content: json({ $ref: "#/components/schemas/Error" }),
			},
		},
		schemas: {
			Error: {
				type: "object",
				required: ["message"],
				properties: { message: { type: "string" } },
			},
			Message: {
				type: "object",
				required: ["message"],
				properties: { message: { type: "string" } },
			},
			Detail: {
				type: "object",
				required: ["detail"],
				properties: { detail: { type: "string" } },
			},
			GenericObject: {
				type: "object",
				additionalProperties: true,
			},
			DiscordUser: {
				type: "object",
				required: ["id", "username"],
				properties: {
					id: { type: "string" },
					username: { type: "string" },
					global_name: { type: "string", nullable: true },
					avatar: { type: "string", nullable: true },
				},
				additionalProperties: true,
			},
			DiscordGuild: {
				type: "object",
				required: ["id", "name"],
				properties: {
					id: { type: "string" },
					name: { type: "string" },
					icon: { type: "string", nullable: true },
				},
				additionalProperties: true,
			},
			GuildMember: {
				type: "object",
				properties: {
					id: { type: "string" },
					roles: { type: "array", items: { type: "string" } },
					avatarURL: { type: "string", nullable: true },
				},
				additionalProperties: true,
			},
			ServerData: {
				type: "object",
				required: ["admin", "serverDataDb", "serverDataDiscord"],
				properties: {
					admin: { type: "boolean" },
					serverDataDb: {
						$ref: "#/components/schemas/GenericObject",
					},
					serverDataDiscord: {
						$ref: "#/components/schemas/DiscordGuild",
					},
				},
			},
			Game: {
				type: "object",
				required: ["gameId", "name", "serverId"],
				properties: {
					gameId: { type: "integer" },
					name: { type: "string" },
					description: { type: "string", nullable: true },
					categoryId: { type: "integer", nullable: true },
					serverId: { type: "string" },
					channels: {
						type: "array",
						items: { type: "string" },
						nullable: true,
					},
				},
				additionalProperties: true,
			},
			Tag: {
				type: "object",
				required: ["tagId", "name", "serverId"],
				properties: {
					tagId: { type: "integer" },
					name: { type: "string" },
					serverId: { type: "string" },
				},
				additionalProperties: true,
			},
			NameRequest: {
				type: "object",
				required: ["name"],
				properties: { name: { type: "string" } },
			},
			CreateGameRequest: {
				type: "object",
				required: ["name"],
				properties: {
					name: { type: "string" },
					description: { type: "string", nullable: true },
					categoryId: { type: "integer", nullable: true },
				},
			},
			UpdateGameRequest: {
				type: "object",
				properties: {
					name: { type: "string", nullable: true },
					description: { type: "string", nullable: true },
					categoryId: { type: "integer", nullable: true },
					channels: {
						type: "array",
						items: { type: "string" },
						nullable: true,
					},
					tagIds: {
						type: "array",
						items: { type: "integer" },
						nullable: true,
					},
					roleIds: {
						type: "array",
						items: { type: "string" },
						nullable: true,
					},
				},
			},
			AssignRoleCategoryRequest: {
				type: "object",
				required: ["roleCategoryId", "roleId"],
				properties: {
					roleCategoryId: { type: "integer", nullable: true },
					roleId: { type: "string" },
				},
			},
			UpdateRoleRequest: {
				type: "object",
				properties: {
					selfAssignable: { type: "boolean", nullable: true },
					description: { type: "string", nullable: true },
				},
			},
			UpdateServerRequest: {
				type: "object",
				required: ["verificationRequired"],
				properties: {
					verificationRequired: { type: "boolean" },
				},
			},
		},
	},
};

app.get("/", (c) => c.json(openApiDoc));

export { openApiDoc };
export default app;
