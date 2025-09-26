import type { APIUser } from "discord-api-types/v10";
import * as z from "zod";

export type Guild = {
	id: string;
	name: string;
	icon: string | null;
	owner_id: string;
	owner_name: string;
	owner_nick: string | null; // nick is server-specific. optional
	member_count: number;
};

// new type for hono
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
	me: APIUser;
	guilds: Guild[];
};

export type ServerDataDb = {
	server_id: string;
	roles: Role[] | null;
	categories: Category[] | null;
	role_categories: RoleCategory[] | null;
	tags: Tag[] | null;
	games: Game[] | null;
};

export type Category = {
	id: number;
	name: string;
};

export type RoleCategory = {
	id: number;
	name: string;
};

export type Tag = {
	tagId: number;
	name: string;
	serverId: string | null;
};

export type Role = {
	id: string;
	role_category_id: number | null;
};

export type Channel = {
	id: string;
};

export type Game = {
	id: number;
	name: string;
	description: string | null;
	category: Category | null;
	tags: Tag[] | null;
	roles_to_add: Role[] | null;
	channels: Channel[] | null;
};

export type ServerDataDiscord = {
	id: string;
	name: string;
	icon: string | null;
	owner_id: string;
	owner_name: string;
	owner_nick: string | null;
	member_count: number;
	roles: ServerDataDiscordRole[] | null;
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
};

export type ServerDataDiscordRole2 = {
	id: string;
	name: string;
	color: `#${string}`; // hex color
	icon: string | null;
	managed: boolean;
	meInRole: boolean;
};

export type ServerDataDiscordRole = {
	id: string;
	name: string;
	color: number[]; // [r, g, b]
	display_icon: string | null;
	mention: string;
	icon: string | null;
	me_in_role: boolean;
};

export type ServerData = {
	admin: boolean;
	server_data_db: ServerDataDb;
	server_data_discord: ServerDataDiscord;
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

export const SyncRolesResponse = z.object({
	roles_created: z.array(z.string()),
	roles_deleted: z.array(z.string()),
});

export type CreateServerResponse = {
	serverId: string;
	createdAt: Date;
};

export type CreateGameDBParams = {
	serverId: string;
	name: string;
	description: string | null;
	categoryId: number | null;
};

export const CreateGameRequestBody = z.object({
	name: z.string(),
	description: z.string().nullable(),
	categoryId: z.number().nullable(),
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
	gameId: z.number(),
	serverId: z.string(),
	name: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	categoryId: z.number().nullable().optional(),
	thumbnail: z.instanceof(Buffer).nullable().optional(),
	channels: z.array(z.string()).nullable().optional(),
	tagIds: z.array(z.number()).nullable().optional(),
	roleIds: z.array(z.string()).nullable().optional(),
});

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

export const AddTagsToGameRequestBody = z.object({
	tagIds: z.array(z.number()),
});

export const UpdateGameThumbnailRequestBody = z.object({
	file: z.instanceof(Buffer),
});

export const NameRequiredRequestBody = z.object({
	name: z.string(),
});
