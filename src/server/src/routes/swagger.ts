import { Hono } from "hono";

const app = new Hono();

type OpenApiObject = Record<string, unknown>;

const HTTP_METHODS = new Set([
	"delete",
	"get",
	"head",
	"options",
	"patch",
	"post",
	"put",
	"trace",
]);

const isObject = (value: unknown): value is OpenApiObject =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const joinRoutePath = (parentPath: string, childPath: string) => {
	const joinedPath = `${parentPath}/${childPath}`
		.replace(/\/+/g, "/")
		.replace(/\/$/, "");

	return (joinedPath || "/").replace(/:([^/]+)/g, "{$1}");
};

const normalizeParameters = (parameters: unknown, path: string) => {
	const normalized: OpenApiObject[] = Array.isArray(parameters)
		? parameters.filter(isObject)
		: isObject(parameters)
			? Object.entries(parameters).map(([name, parameter]) => {
					const definition = isObject(parameter) ? parameter : {};
					const { type, ...details } = definition;

					return {
						...details,
						name,
						in: "query",
						schema: isObject(definition.schema)
							? definition.schema
							: { type: typeof type === "string" ? type : "string" },
					};
				})
			: [];

	for (const match of path.matchAll(/\{([^}]+)\}/g)) {
		const name = match[1];
		const isAlreadyDeclared = normalized.some(
			(parameter) => parameter.name === name && parameter.in === "path",
		);

		if (!isAlreadyDeclared) {
			normalized.push({
				name,
				in: "path",
				required: true,
				schema: { type: "string" },
			});
		}
	}

	return normalized;
};

const buildOpenApiPaths = (routeTree: OpenApiObject) => {
	const paths: Record<string, OpenApiObject> = {};

	const visit = (node: OpenApiObject, currentPath: string) => {
		const sharedResponses = isObject(node.responses)
			? node.responses
			: undefined;

		for (const [key, value] of Object.entries(node)) {
			if (HTTP_METHODS.has(key) && isObject(value)) {
				const operation = { ...value };
				const parameters = normalizeParameters(
					operation.parameters,
					currentPath,
				);

				if (parameters.length > 0) {
					operation.parameters = parameters;
				}
				if (!isObject(operation.responses) && sharedResponses) {
					operation.responses = sharedResponses;
				}

				paths[currentPath] ??= {};
				paths[currentPath][key] = operation;
			} else if (key.startsWith("/") && isObject(value)) {
				visit(value, joinRoutePath(currentPath, key));
			}
		}
	};

	visit(routeTree, "");
	return paths;
};

const openApiDoc = {
	openapi: "3.0.0", //required version field
	info: {
		title: "juicer",
		version: "0.0.1",
		description: "juicer API",
	},
	paths: buildOpenApiPaths({
		"/discord": {
			"/auth": {
				"/me": {
					get: {
						summary: "Get the authenticated Discord user",
						description: "Get the authenticated Discord user's profile",
						responses: {
							"200": {
								description: "Authenticated Discord user",
								content: {
									"application/json": {
										schema: {
											type: "object",
											properties: {
												userData: {
													type: "object",
												},
											},
										},
									},
								},
							},
						},
					},
				},
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
				"/remove-cookies": {
					get: {
						summary: "Remove Discord authentication cookies",
						description: "Delete the Discord access and refresh token cookies",
						responses: {
							"200": {
								description: "Authentication cookies removed",
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
		"/discord/servers/:serverId": {
			"/": {
				get: {
					summary: "Get server data from both the DB and Discord API",
					description: "Get server data from both the DB and Discord API",
					responses: {
						"200": {
							description: "Server data from both the DB and Discord API",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											admin: {
												type: "boolean",
											},
											serverDataDb: {
												type: "ServerDataDb",
											},
											serverDataDiscord: {
												type: "Guild",
											},
										},
									},
								},
							},
						},
					},
				},
				put: {
					summary: "Update server settings",
					description: "Update whether verification is required for the server",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										verificationRequired: {
											type: "boolean",
										},
									},
									required: ["verificationRequired"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Server settings updated",
						},
						"403": {
							description: "User does not have manage server permission.",
						},
					},
				},
			},
			"/create": {
				post: {
					summary: "Create server data in the DB.",
					description: "Create server data in the DB.",
					responses: {
						"200": {
							description: "Server data created in the DB",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											message: {
												type: "string",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"/me": {
				get: {
					summary: "Get my data in the desired server",
					description: "Get my data in the desired server",
					responses: {
						"200": {
							description: "My data in the desired server",
							content: {
								"application/json": {
									schema: {
										type: "MyDataInServer",
									},
								},
							},
						},
					},
				},
			},
			"/sync-roles": {
				get: {
					summary: "Sync roles with the DB and Discord API",
					description: "Sync roles with the DB and Discord API",
				},
				responses: {
					"200": {
						description: "Roles synced with the DB and Discord API",
						content: {
							"application/json": {
								schema: {
									type: "SyncRolesResponse",
								},
							},
						},
					},
					"403": {
						description: "User does not have manage server permission.",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
										},
									},
								},
							},
						},
					},
				},
			},
			"/categories": {
				"/:categoryId": {
					delete: {
						summary: "Delete a category in the server",
						description: "Delete a category in the server",
						responses: {
							"200": {
								description: "Category deleted in the server",
								content: {
									"application/json": {
										schema: {
											type: "Category",
										},
									},
								},
							},
						},
					},
				},
				"/create": {
					post: {
						summary: "Create a category in the server",
						description: "Create a category in the server",
					},
					responses: {
						"200": {
							description: "Category created",
							content: {
								"application/json": {
									schema: {
										type: "Category",
									},
								},
							},
						},
					},
				},
			},
			"/games/create": {
				post: {
					summary: "Create a game in the server",
					description: "Create a game in the server",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										name: {
											type: "string",
										},
										description: {
											type: "string",
										},
										categoryId: {
											type: "number",
											nullable: true,
										},
									},
									required: ["name", "description"],
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Game created",
						},
						"403": {
							description: "User does not have manage server permission.",
						},
					},
				},
			},
			"/games/:gameId": {
				"/": {
					put: {
						summary: "Update a game in the server",
						description: "Update a game in the server",
					},
					delete: {
						summary: "Delete a game in the server",
						description: "Delete a game in the server",
					},
				},
				responses: {
					"200": {
						description: "Game updated or deleted",
						content: {
							"application/json": {
								schema: {
									type: "boolean",
								},
							},
						},
					},
				},
				"/categories/add": {
					post: {
						summary: "Add a category to a game in the server",
						description: "Add a category to a game in the server",
						requestBody: {
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											categoryId: {
												type: "number",
											},
										},
									},
								},
							},
						},
						responses: {
							"200": {
								description: "Category added to the game",
								content: {
									"application/json": {
										schema: {
											type: "games.$inferInsert",
										},
									},
								},
							},
						},
					},
				},
				"/tags/tag": {
					post: {
						summary: "Tag a game in the server",
						description: "Tag a game in the server",
						requestBody: {
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											tagIds: {
												type: "array",
												items: {
													type: "number",
												},
											},
										},
									},
								},
							},
						},
						responses: {
							"200": {
								description: "Game tagged",
								content: {
									"application/json": {
										schema: {
											type: "boolean",
										},
									},
								},
							},
						},
					},
				},
				"/tags/:tagId/untag": {
					post: {
						summary: "Untag a game in the server",
						description: "Untag a game in the server",
					},
					responses: {
						"200": {
							description: "Game untagged",
							content: {
								"application/json": {
									schema: {
										type: "boolean",
									},
								},
							},
						},
					},
				},
				"/thumbnail": {
					get: {
						summary: "Get the thumbnail of a game in the server",
						description: "Get the thumbnail of a game in the server",
					},
					responses: {
						"200": {
							description: "Thumbnail of the game",
							content: {
								"application/json": {
									schema: {
										type: "Buffer",
									},
								},
							},
						},
					},
				},
				"/thumbnail/update": {
					put: {
						summary: "Update the thumbnail of a game in the server",
						description: "Update the thumbnail of a game in the server",
					},
					responses: {
						"200": {
							description: "Thumbnail updated",
							content: {
								"application/json": {
									schema: {
										type: "Buffer",
									},
								},
							},
						},
					},
				},
			},
			"/role-categories": {
				"/:roleCategoryId": {
					delete: {
						summary: "Delete a role's category in the server",
						description: "Delete a role's category in the server",
						responses: {
							"200": {
								description: "Role category deleted",
								content: {
									"application/json": {
										schema: {
											type: "boolean",
										},
									},
								},
							},
						},
					},
				},
				"/assign": {
					post: {
						summary: "Assign a role category to a role in the server",
						description: "Assign a role category to a role in the server",
						requestBody: {
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											roleId: {
												type: "string",
											},
											roleCategoryId: {
												type: "number",
												nullable: true,
											},
										},
										required: ["roleId"],
									},
								},
							},
						},
						responses: {
							"200": {
								description: "Role category assigned to the role",
								content: {
									"application/json": {
										schema: {
											type: "roles.$inferInsert",
										},
									},
								},
							},
						},
					},
				},
				"/create": {
					post: {
						summary: "Create a role category in the server",
						description: "Create a role category in the server",
						requestBody: {
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											name: {
												type: "string",
											},
										},
									},
								},
							},
						},
					},
					responses: {
						"200": {
							description: "Role category created",
							content: {
								"application/json": {
									schema: {
										type: "roleCategories.$inferInsert",
									},
								},
							},
						},
					},
				},
			},
			"/roles": {
				"/": {
					get: {
						summary: "Get all roles in the server",
						description: "Get all roles in the server",
						responses: {
							"200": {
								description: "All roles in the server",
								content: {
									"application/json": {
										schema: {
											type: "object",
											properties: {
												serverRoles: {
													type: "array",
													items: {
														type: "Role",
													},
												},
											},
											myRoles: {
												type: "array",
												items: {
													type: "Role",
												},
											},
										},
									},
								},
							},
						},
					},
				},
				"/:roleId/assign": {
					post: {
						summary: "Assign a role to myself",
						description: "Assign a role to myself",
					},
					responses: {
						"200": {
							description: "Role assigned to myself",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											message: {
												type: "string",
											},
										},
									},
								},
							},
						},
					},
				},
				"/:roleId/unassign": {
					post: {
						summary: "Unassign a role from myself",
						description: "Unassign a role from myself",
						responses: {
							"200": {
								description: "Role unassigned from myself",
								content: {
									"application/json": {
										schema: {
											type: "object",
											properties: {
												message: {
													type: "string",
												},
											},
										},
									},
								},
							},
						},
					},
				},
				"/:roleId/update": {
					post: {
						summary: "Update a role in the server",
						description:
							"Update whether a role is self-assignable and its description",
						requestBody: {
							required: true,
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											selfAssignable: {
												type: "boolean",
												nullable: true,
											},
											description: {
												type: "string",
												nullable: true,
											},
										},
									},
								},
							},
						},
						responses: {
							"200": {
								description: "Role updated",
							},
							"403": {
								description: "User does not have manage server permission.",
							},
						},
					},
				},
			},
			"/search": {
				"/all": {
					get: {
						summary: "Search for games in the server",
						description: "Search for games in the server",
						parameters: {
							query: {
								type: "string",
								description: "Query(name/tag/category)",
								required: true,
							},
						},
						responses: {
							"200": {
								description: "Games found in the server",
								content: {
									"application/json": {
										schema: {
											type: "array",
											items: {
												type: "Game",
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"/tags": {
				"/": {
					get: {
						summary: "Get all tags in the server",
						description: "Get all tags in the server",
						responses: {
							"200": {
								description: "All tags in the server",
								content: {
									"application/json": {
										schema: {
											type: "array",
											items: {
												type: "Tag",
											},
										},
									},
								},
							},
						},
					},
				},
				"/create": {
					post: {
						summary: "Create a tag in the server",
						description: "Create a tag in the server",
						requestBody: {
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											name: {
												type: "string",
											},
										},
									},
								},
							},
						},
						responses: {
							"200": {
								description: "Tag created",
								content: {
									"application/json": {
										schema: {
											type: "Tag",
										},
									},
								},
							},
						},
					},
				},
				"/:tagId": {
					delete: {
						summary: "Delete a tag in the server",
						description: "Delete a tag in the server",
					},
				},
				responses: {
					"200": {
						description: "Tag deleted",
						content: {
							"application/json": {
								schema: {
									type: "Tag",
								},
							},
						},
					},
				},
			},
		},
	}),
};

app.get("/", (c) => {
	return c.json(openApiDoc);
});

export default app;
