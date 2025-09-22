import "dotenv/config";

import { and, eq, inArray } from "drizzle-orm";
import type {
	CreateCategoryRequestBody,
	CreateGameRequestBody,
	CreateGameResponse,
	CreateRoleCategoryRequestBody,
	CreateRoleInDbRequestBody,
	CreateServerResponse,
	CreateTagRequestBody,
	DeleteGameRequestBody,
	DeleteTagRequestBody,
	GetAllTagsInServerRequestBody,
	Tag,
	UpdateGameRequestBody,
} from "../../shared/dist/index.js";
import { db } from "./db/index.js";
import {
	categories,
	games,
	gamesRoles,
	gamesTags,
	roleCategories,
	roles,
	servers,
	tags,
} from "./db/schemas.js";

//TODO return typing
//get_games_by_server, get_game_thumbnail merged to this
export const getServerDataInDb = async (serverId: string): Promise<unknown> => {
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
): Promise<unknown> => {
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
	return await db.insert(servers).values({ serverId }).returning();
};

export const createGame = async ({
	serverId,
	name,
	description,
	categoryId,
}: CreateGameRequestBody): Promise<CreateGameResponse[]> => {
	return await db
		.insert(games)
		.values({ serverId, name, description, categoryId })
		.returning();
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
}: UpdateGameRequestBody): Promise<boolean> => {
	const gameInfo = await db.query.games.findFirst({
		where: and(eq(games.gameId, gameId), eq(games.serverId, serverId)),
		with: {
			gamesTags: true,
			gamesRoles: true,
		},
	});
	if (!gameInfo) {
		// TODO throw an error if game not found
		return false;
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

	await db
		.update(games)
		.set(updateFields)
		.where(and(eq(games.gameId, gameId), eq(games.serverId, serverId)))
		.returning();

	// update tags table
	const existingTagIds = gameInfo.gamesTags.map((tag) => tag.tagId);
	// tags to add
	const tagsToAdd = tagIds?.filter((tagId) => !existingTagIds.includes(tagId));
	// tags to remove
	const tagsToRemove = existingTagIds.filter(
		(tagId) => !tagIds?.includes(tagId),
	);
	if (tagsToAdd) {
		await db
			.insert(gamesTags)
			.values(tagsToAdd.map((tagId) => ({ gameId, tagId })));
	}
	if (tagsToRemove) {
		await db.delete(gamesTags).where(inArray(gamesTags.tagId, tagsToRemove));
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
	if (rolesToAdd) {
		await db
			.insert(gamesRoles)
			.values(rolesToAdd.map((roleId) => ({ gameId, roleId })));
	}
	if (rolesToRemove) {
		await db
			.delete(gamesRoles)
			.where(inArray(gamesRoles.roleId, rolesToRemove));
	}
	return true;
};

export const deleteGame = async ({
	gameId,
	serverId,
}: DeleteGameRequestBody): Promise<boolean> => {
	const gameInfo = await db.query.games.findFirst({
		where: and(eq(games.gameId, gameId), eq(games.serverId, serverId)),
	});
	if (!gameInfo) {
		// TODO throw an error if game not found
		return false;
	}
	// delete the game
	await db
		.delete(games)
		.where(and(eq(games.gameId, gameId), eq(games.serverId, serverId)));
	return true;
};

export const createTag = async ({
	serverId,
	name,
}: CreateTagRequestBody): Promise<Tag[]> => {
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
}: GetAllTagsInServerRequestBody): Promise<Tag[]> => {
	return await db.query.tags.findMany({
		where: eq(tags.serverId, serverId),
	});
};

export const deleteTag = async ({
	tagId,
	serverId,
}: DeleteTagRequestBody): Promise<Tag[]> => {
	return await db
		.delete(tags)
		.where(and(eq(tags.tagId, tagId), eq(tags.serverId, serverId)))
		.returning();
};

export const createRoleInDb = async ({
	serverId,
	roleId,
}: CreateRoleInDbRequestBody): Promise<any> => {
	try {
		return await db.insert(roles).values({ serverId, roleId }).returning();
	} catch (error) {
		// TODO catch UniqueViolation
		return error;
	}
};

export const getAllRolesInServer = async ({
	serverId,
}: {
	serverId: string;
}): Promise<any> => {
	return await db.query.roles.findMany({
		where: eq(roles.serverId, serverId),
	});
};

export const deleteRoleFromDb = async ({
	roleId,
	serverId,
}: {
	roleId: string;
	serverId: string;
}): Promise<any> => {
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
}: CreateCategoryRequestBody): Promise<any> => {
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
}): Promise<any> => {
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

export const createRoleCategory = async ({
	serverId,
	name,
}: CreateRoleCategoryRequestBody): Promise<any> => {
	return await db.insert(roleCategories).values({ serverId, name }).returning();
};

export const deleteRoleCategory = async ({
	roleCategoryId,
	serverId,
}: {
	roleCategoryId: number;
	serverId: string;
}): Promise<any> => {
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
}): Promise<any> => {
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

export const findGamesByCateogryOrTagsOrName = async ({
	serverId,
	categoryName,
	tagNames,
	name,
}: {
	serverId: string;
	categoryName: string;
	tagNames: string[];
	name: string;
}): Promise<any> => {
	//TODO
};
