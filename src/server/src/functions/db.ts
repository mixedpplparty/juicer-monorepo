import "dotenv/config";

import {
	PG_NOT_NULL_VIOLATION,
	PG_UNIQUE_VIOLATION,
} from "@drdgvhbh/postgres-error-codes";
import { and, DrizzleQueryError, eq, ilike, inArray, isNotNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
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
	UpdateGameRequestBodyWithImageAsBuffer,
	UpdateGameResponse,
	UpdateServerVerificationRequiredRequestBody,
} from "juicer-shared/dist/types/index.js";
import { DatabaseError } from "pg";
import type * as z from "zod";
import { db } from "../db/index.js";
import { isBirthdayEditable } from "./birthday-core.js";
import {
	birthdayAnnouncements,
	birthdays,
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
				// Exclude the heavy thumbnail bytea — the client fetches thumbnails
				// lazily via the dedicated endpoint, never from this payload.
				columns: { thumbnail: false },
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
}: z.infer<typeof UpdateGameRequestBodyWithImageAsBuffer> & {
	gameId: number;
	serverId: string;
	thumbnail?: Buffer | null | undefined;
}): Promise<UpdateGameResponse> => {
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
			}
			return val !== null && val !== undefined;
		}),
	) as Partial<typeof games.$inferInsert>;

	await db.transaction(async (tx) => {
		if (Object.keys(updateFields).length > 0) {
			const updatedGame = await tx
				.update(games)
				.set(updateFields)
				.where(and(eq(games.gameId, gameId), eq(games.serverId, serverId)))
				.returning();
			res.updatedGame = updatedGame[0];
		}

		// update tags table
		const existingTagIds = gameInfo.gamesTags.map((tag) => tag.tagId);
		// tags to add
		const tagsToAdd = tagIds?.filter(
			(tagId) => !existingTagIds.includes(tagId),
		);
		// tags to remove
		const tagsToRemove = existingTagIds.filter(
			(tagId) => !tagIds?.includes(tagId),
		);
		if (tagsToAdd && tagsToAdd.length > 0) {
			const addedTags = await tx
				.insert(gamesTags)
				.values(tagsToAdd.map((tagId) => ({ gameId, tagId })))
				.returning();
			res.tags.added = addedTags;
		}
		if (tagsToRemove && tagsToRemove.length > 0) {
			const removedTags = await tx
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
			const addedRoles = await tx
				.insert(gamesRoles)
				.values(rolesToAdd.map((roleId) => ({ gameId, roleId })))
				.returning();
			res.roles.added = addedRoles;
		}
		if (rolesToRemove && rolesToRemove.length > 0) {
			const removedRoles = await tx
				.delete(gamesRoles)
				.where(inArray(gamesRoles.roleId, rolesToRemove))
				.returning();
			res.roles.removed = removedRoles;
		}
	});

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
}) => {
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
		columns: { thumbnail: false },
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
}) => {
	const tagIds = await db.query.tags.findMany({
		where: and(eq(tags.serverId, serverId), inArray(tags.name, tagNames)),
	});
	if (!tagIds) {
		return [];
	}
	return await db.query.games.findMany({
		columns: { thumbnail: false },
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
}) => {
	return await db.query.games.findMany({
		columns: { thumbnail: false },
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
}) => {
	return await db.query.games.findMany({
		columns: { thumbnail: false },
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

export const updateRoleInfo = async ({
	roleId,
	serverId,
	selfAssignable,
	description,
}: {
	roleId: string;
	serverId: string;
	selfAssignable?: boolean | null;
	description?: string | null | undefined;
}): Promise<(typeof roles.$inferInsert)[]> => {
	if (selfAssignable === undefined || selfAssignable === null) {
		selfAssignable = false;
	}
	return await db
		.update(roles)
		.set({ selfAssignable, description })
		.where(and(eq(roles.roleId, roleId), eq(roles.serverId, serverId)))
		.returning();
};

export const updateServerVerificationRequired = async ({
	serverId,
	verificationRequired,
}: {
	serverId: string;
	verificationRequired: boolean;
}): Promise<(typeof servers.$inferInsert)[]> => {
	return await db
		.update(servers)
		.set({ verificationRequired })
		.where(eq(servers.serverId, serverId))
		.returning();
};

// ── Birthdays ───────────────────────────────────────────────────────────

export type ServerRow = typeof servers.$inferSelect;
export type BirthdayRow = typeof birthdays.$inferSelect;
export type BirthdayLedgerRow = typeof birthdayAnnouncements.$inferSelect;

export const getBirthday = async (
	userId: string,
): Promise<BirthdayRow | null> => {
	const row = await db.query.birthdays.findFirst({
		where: eq(birthdays.userId, userId),
	});
	return row ?? null;
};

export const upsertBirthday = async ({
	userId,
	month,
	day,
}: {
	userId: string;
	month: number;
	day: number;
}): Promise<BirthdayRow> => {
	const existing = await db.query.birthdays.findFirst({
		where: eq(birthdays.userId, userId),
	});
	if (existing && !isBirthdayEditable(existing.createdAt, Date.now())) {
		throw new HTTPException(403, {
			message: "Birthday can no longer be changed (edit window closed).",
		});
	}
	// createdAt stays the original first-set time (not in the update set), so it
	// remains the edit-window anchor across edits.
	const [row] = await db
		.insert(birthdays)
		.values({ userId, month, day })
		.onConflictDoUpdate({ target: birthdays.userId, set: { month, day } })
		.returning();
	return row;
};

export const updateServerBirthdayConfig = async ({
	serverId,
	channelId,
	timezone,
	messageTemplate,
	eventNameTemplate,
	eventDescriptionTemplate,
}: {
	serverId: string;
	channelId: string | null;
	timezone: string | null;
	messageTemplate?: string | null;
	eventNameTemplate?: string | null;
	eventDescriptionTemplate?: string | null;
}): Promise<ServerRow> => {
	const [row] = await db
		.update(servers)
		.set({
			birthdayChannelId: channelId,
			birthdayTimezone: timezone,
			birthdayMessageTemplate: messageTemplate ?? null,
			birthdayEventNameTemplate: eventNameTemplate ?? null,
			birthdayEventDescriptionTemplate: eventDescriptionTemplate ?? null,
		})
		.where(eq(servers.serverId, serverId))
		.returning();
	return row;
};

export const getEnabledBirthdayServers = async (): Promise<ServerRow[]> => {
	return await db.query.servers.findMany({
		where: isNotNull(servers.birthdayChannelId),
	});
};

export const getAllBirthdays = async (): Promise<BirthdayRow[]> => {
	return await db.query.birthdays.findMany();
};

export const getBirthdayAnnouncements = async (
	serverId: string,
	years: number[],
): Promise<BirthdayLedgerRow[]> => {
	if (years.length === 0) return [];
	return await db.query.birthdayAnnouncements.findMany({
		where: and(
			eq(birthdayAnnouncements.serverId, serverId),
			inArray(birthdayAnnouncements.year, years),
		),
	});
};

export const markBirthdayEventCreated = async (
	serverId: string,
	userId: string,
	year: number,
	discordEventId: string,
): Promise<void> => {
	await db
		.insert(birthdayAnnouncements)
		.values({ serverId, userId, year, discordEventId })
		.onConflictDoUpdate({
			target: [
				birthdayAnnouncements.serverId,
				birthdayAnnouncements.userId,
				birthdayAnnouncements.year,
			],
			set: { discordEventId },
		});
};

export const markBirthdayAnnounced = async (
	serverId: string,
	userId: string,
	year: number,
): Promise<void> => {
	const announcedAt = new Date();
	await db
		.insert(birthdayAnnouncements)
		.values({ serverId, userId, year, announcedAt })
		.onConflictDoUpdate({
			target: [
				birthdayAnnouncements.serverId,
				birthdayAnnouncements.userId,
				birthdayAnnouncements.year,
			],
			set: { announcedAt },
		});
};
