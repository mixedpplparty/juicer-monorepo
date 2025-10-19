import type { GuildMember as DiscordJSGuildMember } from "discord.js";
import type { APIUser } from "discord-api-types/v10";
import * as z from "zod";

export const ThumbnailImage = z
	.file()
	.mime([
		"image/png",
		"image/jpeg",
		"image/apng",
		"image/avif",
		"image/gif",
		"image/webp",
		"image/bmp",
		"image/svg+xml",
		"image/tiff",
	])
	.min(100)
	.max(1_048_576)
	.optional()
	.nullable();

export type FilteredGuild = {
	id: string;
	name: string;
	icon: string | null;
	ownerId: string;
	ownerName: string;
	ownerNick?: string;
	memberCount: number;
};

export type MyInfo = {
	userData: APIUser;
	guilds: FilteredGuild[];
};

export type ServerDataDb = {
	serverId: string;
	createdAt: Date;
	verificationRequired: boolean;
	verificationRoleId: string | null;
	games: Game[] | null;
	roles: Role[] | null;
	categories: Category[] | null;
	roleCategories: RoleCategory[] | null;
	tags: Tag[] | null;
};

export type Category = {
	categoryId: number;
	serverId: string;
	name: string;
};

export type RoleCategory = {
	roleCategoryId: number;
	serverId: string;
	name: string;
};

export type Tag = {
	tagId: number;
	name: string;
	serverId: string | null;
};

export type TagRelationToGame = {
	gameId: number;
	tagId: number;
};

export type Role = {
	serverId: string;
	roleId: string;
	roleCategoryId: number | null;
	selfAssignable: boolean;
	description: string | null;
};

export type RoleRelationToGame = {
	gameId: number;
	roleId: string;
};

export type Channel = {
	id: string;
};

export type GameWithoutRelations = {
	gameId: number;
	serverId: string;
	name: string;
	description?: string | null;
	categoryId?: number | null;
	thumbnail: Buffer | null;
	channels: string[] | null;
};

// updated id to gameId
// updated category to categoryId
export type Game = GameWithoutRelations & {
	gamesTags: TagRelationToGame[] | null;
	gamesRoles: RoleRelationToGame[] | null;
};

export type FilteredServerDataDiscord = {
	id: string;
	name: string;
	icon: string | null;
	ownerId: string;
	ownerName: string;
	ownerNick: string | null;
	memberCount: number;
	roles: ServerDataDiscordRole2[] | null;
	channels: ServerDataDiscordChannel[] | null;
};

export type ServerDataDiscordChannel = {
	id: string;
	name: string;
};

export type ServerDataDiscordRole2 = {
	id: string;
	name: string;
	color: `#${string}`; // hex color
	icon: string | null;
	managed: boolean;
	meInRole: boolean;
};

export type ServerData = {
	admin: boolean;
	serverDataDb: ServerDataDb | null;
	serverDataDiscord: FilteredServerDataDiscord;
};

export type MyDataInServer = {
	id: string;
	name: string;
	nick: string | null;
	avatar: string | null;
	roles: Role[] | null;
	joined_at: string;
};

export type AuthData = {
	discord_access_token: string;
	discord_refresh_token: string;
};

export type ToastProps = {
	type: "error" | "success" | "info" | null;
};

export type ToastObject = {
	idx: number;
	message: string;
	type: ToastProps["type"];
};

export type MessageOnSuccess = {
	detail: string;
};

export type SyncRolesResponse = {
	roles_created: string[];
	roles_deleted: string[];
};

export type CreateServerResponse = {
	serverId: string;
	createdAt: Date;
	verificationRequired: boolean;
	verificationRoleId: string | null;
};

export type CreateGameDBParams = {
	serverId: string;
	name: string;
	description: string | null;
	categoryId: number | null;
};

export const CreateGameRequestBody = z.object({
	name: z.string(),
	description: z.string().nullable().optional(),
	categoryId: z.number().nullable().optional(),
});

export type CreateGameResponse = {
	gameId: number;
	name: string;
	description: string | null;
	categoryId: number | null;
	serverId: string;
	thumbnail: Buffer | null;
	channels: string[] | null;
};

export const UpdateGameRequestBody = z.object({
	name: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	categoryId: z.number().nullable().optional(),
	thumbnail: ThumbnailImage,
	channels: z.array(z.string()).nullable().optional(),
	tagIds: z.array(z.number()).nullable().optional(),
	roleIds: z.array(z.string()).nullable().optional(),
});

export const UpdateGameRequestBodyWithImageAsBuffer = z.object({
	name: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	categoryId: z.number().nullable().optional(),
	thumbnail: z.instanceof(Buffer).nullable().optional(),
	channels: z.array(z.string()).nullable().optional(),
	tagIds: z.array(z.number()).nullable().optional(),
	roleIds: z.array(z.string()).nullable().optional(),
});

export type UpdateGameResponse = {
	updatedGame: GameWithoutRelations | null;
	tags: {
		added: TagRelationToGame[] | null;
		removed: TagRelationToGame[] | null;
	};
	roles: {
		added: RoleRelationToGame[] | null;
		removed: RoleRelationToGame[] | null;
	};
};

export const DeleteGameRequestBody = z.object({
	gameId: z.number(),
	serverId: z.string(),
});

export const CreateTagRequestBody = z.object({
	serverId: z.string(),
	name: z.string(),
});

export const GetAllTagsInServerRequestBody = z.object({
	serverId: z.string(),
});

export const DeleteTagRequestBody = z.object({
	tagId: z.number(),
	serverId: z.string(),
});

export const CreateRoleInDbRequestBody = z.object({
	serverId: z.string(),
	roleId: z.string(),
});

export const CreateCategoryRequestBody = z.object({
	serverId: z.string(),
	name: z.string(),
});

export const CreateRoleCategoryRequestBody = z.object({
	serverId: z.string(),
	name: z.string(),
});

export const AddCategoryToGameRequestBody = z.object({
	categoryId: z.number(),
});

export const ModifyTagsOfGameRequestBody = z.object({
	tagIds: z.array(z.number()),
});

export const UpdateGameThumbnailRequestBody = z.object({
	file: ThumbnailImage,
});

export const NameRequiredRequestBody = z.object({
	name: z.string(),
});

export const AssignRoleCategoryToRoleRequestBody = z.object({
	roleCategoryId: z.number().nullable(),
	roleId: z.string(),
});

export const SetRoleSelfAssignableRequestBody = z.object({
	selfAssignable: z.boolean().optional().nullable(),
	description: z.string().nullable().optional(),
});

export type GuildMember = DiscordJSGuildMember & {
	avatarURL: string | null;
	bannerURL: string | null;
	displayAvatarURL: string | null;
	displayBannerURL: string | null;
	avatarDecorationURL: string | null;
	roles: string[];
};
