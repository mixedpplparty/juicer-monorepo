import { Hono } from "hono";

const app = new Hono();

const openApiDoc = {
	openapi: "3.0.0", //required version field
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
		"/server/:serverId": {
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
										type: "GuildMember",
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
				"/:roleCategoryId/assign": {
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
										},
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
	},
};

app.get("/", (c) => {
	return c.json(openApiDoc);
});

export default app;
