import "dotenv/config";

import {
	PG_NOT_NULL_VIOLATION,
	PG_UNIQUE_VIOLATION,
} from "@drdgvhbh/postgres-error-codes";
import { and, DrizzleQueryError, eq, ilike, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { DatabaseError } from "pg";
import type * as z from "zod";
import type {
	CreateCategoryRequestBody,
	CreateGameDBParams,
	CreateGameResponse,
	CreateRoleCategoryRequestBody,
	CreateRoleInDbRequestBody,
	CreateServerResponse,
	CreateTagRequestBody,
	DeleteGameRequestBody,
	DeleteTagRequestBody,
	GameWithoutRelations,
	GetAllTagsInServerRequestBody,
	ServerDataDb,
	Tag,
	UpdateGameRequestBody,
	UpdateGameResponse,
} from "../../../shared/dist/index.js";
import { db } from "../db/index.js";
import {
	categories,
	games,
	gamesRoles,
	gamesTags,
	roleCategories,
	roles,
	servers,
	tags,
} from "../db/schemas.js";
//TODO return typing
//get_games_by_server, get_game_thumbnail merged to this
export const getServerDataInDb = async (
	serverId: string,
): Promise<ServerDataDb | null> => {
	const serverInfo = await db.query.servers.findFirst({
		where: eq(servers.serverId, serverId),
		with: {
			games: {
				with: {
					gamesTags: true,
					gamesRoles: true,
				},
			},
			categories: true,
			tags: true,
			roles: true,
			roleCategories: true,
		},
	});
	if (!serverInfo) {
		return null;
	}
	return serverInfo;
};

//TODO return typing
// get_game_roles merged to this
export const getServerDataInDbWithoutGames = async (
	serverId: string,
): Promise<typeof servers.$inferSelect | null> => {
	const serverInfo = await db.query.servers.findFirst({
		where: eq(servers.serverId, serverId),
		with: {
			categories: true,
			tags: true,
			roles: true,
			roleCategories: true,
		},
	});
	if (!serverInfo) {
		return null;
	}
	return serverInfo;
};

export const createServer = async (
	serverId: string,
): Promise<CreateServerResponse[]> => {
	try {
		return await db.insert(servers).values({ serverId }).returning();
	} catch (error) {
		console.error("Error while creating server.");
		console.error(error);
		if (error instanceof DrizzleQueryError) {
			if (error.cause instanceof DatabaseError) {
				if (error.cause.code === PG_UNIQUE_VIOLATION) {
					throw new HTTPException(400, {
						message: "Server already exists.",
					});
				}
			}
		}
		throw new HTTPException(500, {
			message: "Unknown error while creating server.",
		});
	}
};

export const createGame = async ({
	serverId,
	name,
	description,
	categoryId,
}: CreateGameDBParams): Promise<CreateGameResponse[]> => {
	try {
		return await db
			.insert(games)
			.values({ serverId, name, description, categoryId })
			.returning();
	} catch (error) {
		console.error("Error while creating game.");
		console.error(error);
		if (error instanceof DrizzleQueryError) {
			if (error.cause instanceof DatabaseError) {
				if (error.cause.code === PG_NOT_NULL_VIOLATION) {
					throw new HTTPException(400, {
						message: "Values violated Not Null constraint.",
					});
				}
			}
		}
	}
	throw new HTTPException(500, {
		message: "Unknown error while creating game.",
	});
};

// TODO more debugging messages to return errors
// add_or_update_game_thumbnail, add_tags_to_game, add_tags_to_game_by_ids, remove_tag_from_game, map_roles_to_game, map_category_to_game merged to this
export const updateGame = async ({
	gameId,
	serverId,
	name,
	description,
	categoryId,
	thumbnail,
	channels,
	tagIds,
	roleIds,
}: z.infer<typeof UpdateGameRequestBody>): Promise<UpdateGameResponse> => {
	const res: UpdateGameResponse = {
		updatedGame: null,
		tags: {
			added: null,
			removed: null,
		},
		roles: {
			added: null,
			removed: null,
		},
	};
	const gameInfo = await db.query.games.findFirst({
		where: and(eq(games.gameId, gameId), eq(games.serverId, serverId)),
		with: {
			gamesTags: true,
			gamesRoles: true,
		},
	});
	if (!gameInfo) {
		throw new HTTPException(404, {
			message: "Game not found.",
		});
	}
	// only update fields that are not null/undefined
	const updateFields = Object.fromEntries(
		Object.entries({
			name,
			description,
			categoryId,
			thumbnail,
			channels,
		}).filter(([key, val]) => {
			if (key === "thumbnail") {
				return val !== null && val !== undefined && val !== "";
			} else if (key === "categoryId" && categoryId === -1) {
				//set categoryId to null
				return null;
			}
			return val !== null && val !== undefined;
		}),
	) as Partial<typeof games.$inferInsert>;

	if (Object.keys(updateFields).length > 0) {
		const updatedGame = await db
			.update(games)
			.set(updateFields)
			.where(and(eq(games.gameId, gameId), eq(games.serverId, serverId)))
			.returning();
		res.updatedGame = updatedGame[0];
	} else {
		console.log("DEBUG: no fields to update");
	}

	// update tags table
	const existingTagIds = gameInfo.gamesTags.map((tag) => tag.tagId);
	// tags to add
	const tagsToAdd = tagIds?.filter((tagId) => !existingTagIds.includes(tagId));
	// tags to remove
	const tagsToRemove = existingTagIds.filter(
		(tagId) => !tagIds?.includes(tagId),
	);
	if (tagsToAdd && tagsToAdd.length > 0) {
		const addedTags = await db
			.insert(gamesTags)
			.values(tagsToAdd.map((tagId) => ({ gameId, tagId })))
			.returning();
		res.tags.added = addedTags;
	}
	if (tagsToRemove && tagsToRemove.length > 0) {
		const removedTags = await db
			.delete(gamesTags)
			.where(inArray(gamesTags.tagId, tagsToRemove))
			.returning();
		res.tags.removed = removedTags;
	}

	// update roles table
	const existingRoleIds = gameInfo.gamesRoles.map((role) => role.roleId);
	// roles to add
	const rolesToAdd = roleIds?.filter(
		(roleId) => !existingRoleIds.includes(roleId),
	);
	// roles to remove
	const rolesToRemove = existingRoleIds.filter(
		(roleId) => !roleIds?.includes(roleId),
	);
	if (rolesToAdd && rolesToAdd.length > 0) {
		const addedRoles = await db
			.insert(gamesRoles)
			.values(rolesToAdd.map((roleId) => ({ gameId, roleId })))
			.returning();
		res.roles.added = addedRoles;
	}
	if (rolesToRemove && rolesToRemove.length > 0) {
		const removedRoles = await db
			.delete(gamesRoles)
			.where(inArray(gamesRoles.roleId, rolesToRemove))
			.returning();
		res.roles.removed = removedRoles;
	}
	return res;
};

export const deleteGame = async ({
	gameId,
	serverId,
}: z.infer<typeof DeleteGameRequestBody>): Promise<GameWithoutRelations> => {
	const gameInfo = await db.query.games.findFirst({
		where: and(eq(games.gameId, gameId), eq(games.serverId, serverId)),
	});
	if (!gameInfo) {
		throw new HTTPException(404, {
			message: "Game not found.",
		});
	}
	// delete the game
	const deletedGame = await db
		.delete(games)
		.where(and(eq(games.gameId, gameId), eq(games.serverId, serverId)))
		.returning();
	return deletedGame[0];
};

export const createTag = async ({
	serverId,
	name,
}: z.infer<typeof CreateTagRequestBody>): Promise<Tag[]> => {
	const tagInfo = await db.query.tags.findFirst({
		where: and(eq(tags.serverId, serverId), eq(tags.name, name)),
	});
	if (tagInfo) {
		// tag exists
		return [tagInfo];
	}
	return await db.insert(tags).values({ serverId, name }).returning();
};

export const getAllTagsInServer = async ({
	serverId,
}: z.infer<typeof GetAllTagsInServerRequestBody>): Promise<Tag[]> => {
	return await db.query.tags.findMany({
		where: eq(tags.serverId, serverId),
	});
};

export const deleteTag = async ({
	tagId,
	serverId,
}: z.infer<typeof DeleteTagRequestBody>): Promise<Tag[]> => {
	return await db
		.delete(tags)
		.where(and(eq(tags.tagId, tagId), eq(tags.serverId, serverId)))
		.returning();
};

export const createRoleInDb = async ({
	serverId,
	roleId,
}: z.infer<typeof CreateRoleInDbRequestBody>): Promise<
	(typeof roles.$inferInsert)[] | unknown
> => {
	try {
		return await db.insert(roles).values({ serverId, roleId }).returning();
	} catch (error) {
		// TODO catch UniqueViolation
		return error;
	}
};

export const getAllRolesInServerInDb = async ({
	serverId,
}: {
	serverId: string;
}): Promise<(typeof roles.$inferSelect)[]> => {
	return await db.query.roles.findMany({
		where: eq(roles.serverId, serverId),
	});
};

export const getRoleInServerInDbByRoleIds = async ({
	roleIds,
	serverId,
}: {
	roleIds: string[];
	serverId: string;
}): Promise<(typeof roles.$inferSelect)[]> => {
	return await db.query.roles.findMany({
		where: and(inArray(roles.roleId, roleIds), eq(roles.serverId, serverId)),
	});
};

export const deleteRoleFromDb = async ({
	roleId,
	serverId,
}: {
	roleId: string;
	serverId: string;
}): Promise<boolean> => {
	// delete from roles table
	await db
		.delete(roles)
		.where(and(eq(roles.roleId, roleId), eq(roles.serverId, serverId)));
	// delete from games_roles table
	await db.delete(gamesRoles).where(eq(gamesRoles.roleId, roleId));

	return true;
};

export const createCategory = async ({
	serverId,
	name,
}: z.infer<typeof CreateCategoryRequestBody>): Promise<
	(typeof categories.$inferInsert)[] | unknown
> => {
	try {
		return await db.insert(categories).values({ serverId, name }).returning();
	} catch (error) {
		// TODO catch UniqueViolation (same name in server)
		return error;
	}
};

export const deleteCategory = async ({
	categoryId,
	serverId,
}: {
	categoryId: number;
	serverId: string;
}): Promise<(typeof categories.$inferInsert)[] | unknown> => {
	return await db
		.delete(categories)
		.where(
			and(
				eq(categories.categoryId, categoryId),
				eq(categories.serverId, serverId),
			),
		)
		.returning();
};

export const mapCategoryToGame = async ({
	gameId,
	serverId,
	categoryId,
}: {
	gameId: number;
	serverId: string;
	categoryId: number;
}): Promise<(typeof games.$inferInsert)[]> => {
	return await db
		.update(games)
		.set({ categoryId })
		.where(and(eq(games.gameId, gameId), eq(games.serverId, serverId)))
		.returning();
};

export const createRoleCategory = async ({
	serverId,
	name,
}: z.infer<typeof CreateRoleCategoryRequestBody>): Promise<
	(typeof roleCategories.$inferInsert)[]
> => {
	return await db.insert(roleCategories).values({ serverId, name }).returning();
};

export const deleteRoleCategory = async ({
	roleCategoryId,
	serverId,
}: {
	roleCategoryId: number;
	serverId: string;
}): Promise<(typeof roleCategories.$inferInsert)[]> => {
	return await db
		.delete(roleCategories)
		.where(
			and(
				eq(roleCategories.roleCategoryId, roleCategoryId),
				eq(roleCategories.serverId, serverId),
			),
		)
		.returning();
};

export const updateRoleCategoryOfRole = async ({
	roleId,
	roleCategoryId,
	serverId,
}: {
	roleId: string;
	roleCategoryId: number | null;
	serverId: string;
}): Promise<(typeof roles.$inferInsert)[]> => {
	if (roleCategoryId === null) {
		// unassign the role category from the role
		return await db
			.update(roles)
			.set({ roleCategoryId: null })
			.where(and(eq(roles.roleId, roleId), eq(roles.serverId, serverId)))
			.returning();
	} else {
		// assign the role category to the role
		return await db
			.update(roles)
			.set({ roleCategoryId })
			.where(and(eq(roles.roleId, roleId), eq(roles.serverId, serverId)))
			.returning();
	}
};

export const findGamesByCategoryName = async ({
	serverId,
	categoryName,
}: {
	serverId: string;
	categoryName: string;
}): Promise<(typeof games.$inferSelect)[]> => {
	const categoryId = await db.query.categories.findFirst({
		where: and(
			eq(categories.serverId, serverId),
			eq(categories.name, categoryName),
		),
	});
	if (!categoryId) {
		return [];
	}
	return await db.query.games.findMany({
		where: and(
			eq(games.serverId, serverId),
			eq(games.categoryId, categoryId.categoryId),
		),
		with: {
			gamesTags: true,
			gamesRoles: true,
		},
	});
};

export const findGamesByTags = async ({
	serverId,
	tagNames,
}: {
	serverId: string;
	tagNames: string[];
}): Promise<(typeof games.$inferSelect)[]> => {
	const tagIds = await db.query.tags.findMany({
		where: and(eq(tags.serverId, serverId), inArray(tags.name, tagNames)),
	});
	if (!tagIds) {
		return [];
	}
	return await db.query.games.findMany({
		where: and(
			eq(games.serverId, serverId),
			inArray(
				gamesTags.tagId,
				tagIds.map((tag) => tag.tagId),
			),
		),
		with: {
			gamesTags: true,
			gamesRoles: true,
		},
	});
};

export const findGamesByName = async ({
	serverId,
	name,
}: {
	serverId: string;
	name: string;
}): Promise<(typeof games.$inferSelect)[]> => {
	return await db.query.games.findMany({
		where: and(eq(games.serverId, serverId), ilike(games.name, `%${name}%`)),
		with: {
			gamesTags: true,
			gamesRoles: true,
		},
	});
};

export const getAllGamesInServer = async ({
	serverId,
}: {
	serverId: string;
}): Promise<(typeof games.$inferSelect)[]> => {
	return await db.query.games.findMany({
		where: eq(games.serverId, serverId),
		with: {
			gamesTags: true,
			gamesRoles: true,
		},
	});
};

export const updateGameThumbnail = async ({
	gameId,
	serverId,
	thumbnail,
}: {
	gameId: number;
	serverId: string;
	thumbnail: Buffer;
}): Promise<(typeof games.$inferInsert)[]> => {
	return await db
		.update(games)
		.set({ thumbnail })
		.where(and(eq(games.gameId, gameId), eq(games.serverId, serverId)))
		.returning();
};

export const getGameThumbnail = async ({
	gameId,
	serverId,
}: {
	gameId: number;
	serverId: string;
}): Promise<(typeof games.$inferSelect)["thumbnail"] | null> => {
	return await db.query.games
		.findFirst({
			columns: {
				thumbnail: true,
			},
			where: and(eq(games.gameId, gameId), eq(games.serverId, serverId)),
		})
		.then((res) => res?.thumbnail ?? null);
};
