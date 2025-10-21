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

const FilteredGuild = z.object({
	id: z.string(),
	name: z.string(),
	icon: z.string().nullable(),
	ownerId: z.string(),
	ownerName: z.string(),
	ownerNick: z.string().optional(),
	memberCount: z.number(),
});

export type FilteredGuild = z.infer<typeof FilteredGuild>;

export type MyInfo = {
	userData: APIUser;
	guilds: FilteredGuild[];
};

const Category = z.object({
	categoryId: z.number(),
	serverId: z.string(),
	name: z.string(),
});
export type Category = z.infer<typeof Category>;

const RoleCategory = z.object({
	roleCategoryId: z.number(),
	serverId: z.string(),
	name: z.string(),
});
export type RoleCategory = z.infer<typeof RoleCategory>;

const Tag = z.object({
	tagId: z.number(),
	name: z.string(),
	serverId: z.string().nullable(),
});
export type Tag = z.infer<typeof Tag>;

const TagRelationToGame = z.object({
	gameId: z.number(),
	tagId: z.number(),
});
export type TagRelationToGame = z.infer<typeof TagRelationToGame>;

const Role = z.object({
	serverId: z.string(),
	roleId: z.string(),
	roleCategoryId: z.number().nullable(),
	selfAssignable: z.boolean(),
	description: z.string().nullable(),
});

export type Role = z.infer<typeof Role>;

const RoleRelationToGame = z.object({
	gameId: z.number(),
	roleId: z.string(),
});

export type RoleRelationToGame = z.infer<typeof RoleRelationToGame>;

const Channel = z.object({
	id: z.string(),
});

export type Channel = z.infer<typeof Channel>;

const GameWithoutRelations = z.object({
	gameId: z.number(),
	serverId: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	categoryId: z.number().nullable().optional(),
	thumbnail: z.instanceof(Buffer).nullable(),
	channels: z.array(z.string()).nullable(),
});

export type GameWithoutRelations = z.infer<typeof GameWithoutRelations>;

const Game = z.object({
	gamesTags: z.array(z.object(TagRelationToGame)).nullable(),
	gamesRoles: z.array(z.object(RoleRelationToGame)).nullable(),
});

export type Game = GameWithoutRelations & z.infer<typeof Game>;

const ServerDataDiscordRole2 = z.object({
	id: z.string(),
	name: z.string(),
	color: z.string(), // hex color in #ABCDEF
	icon: z.string().nullable(),
	managed: z.boolean(),
	meInRole: z.boolean(),
});

export type FilteredServerDataDiscord = z.infer<
	typeof FilteredServerDataDiscord
>;

const ServerDataDiscordChannel = z.object({
	id: z.string(),
	name: z.string(),
});

export type ServerDataDiscordChannel = z.infer<typeof ServerDataDiscordChannel>;

export type ServerDataDiscordRole2 = z.infer<typeof ServerDataDiscordRole2>;

const FilteredServerDataDiscord = z.object({
	id: z.string(),
	name: z.string(),
	icon: z.string().nullable(),
	ownerId: z.string(),
	ownerName: z.string(),
	ownerNick: z.string().nullable(),
	memberCount: z.number(),
	roles: z.array(ServerDataDiscordRole2).nullable(),
	channels: z.array(ServerDataDiscordChannel).nullable(),
});

const ServerDataDb = z.object({
	serverId: z.string(),
	createdAt: z.date(),
	verificationRequired: z.boolean(),
	games: z.array(Game).nullable(),
	roles: z.array(Role).nullable(),
	categories: z.array(Category).nullable(),
	roleCategories: z.array(RoleCategory).nullable(),
	tags: z.array(Tag).nullable(),
});

export type ServerDataDb = z.infer<typeof ServerDataDb>;

const ServerData = z.object({
	admin: z.boolean(),
	serverDataDb: ServerDataDb.nullable(),
	serverDataDiscord: z.object(FilteredServerDataDiscord),
});

export type ServerData = z.infer<typeof ServerData>;

const MyDataInServer = z.object({
	id: z.string(),
	name: z.string(),
	nick: z.string().nullable(),
	avatar: z.string().nullable(),
	roles: z.array(Role).nullable(),
	joined_at: z.string(),
});

export type MyDataInServer = z.infer<typeof MyDataInServer>;

const AuthData = z.object({
	discord_access_token: z.string(),
	discord_refresh_token: z.string(),
});

export type AuthData = z.infer<typeof AuthData>;

const ToastProps = z.object({
	type: z.enum(["error", "success", "info"]).nullable(),
});

export type ToastProps = z.infer<typeof ToastProps>;

const ToastObject = z.object({
	idx: z.number(),
	message: z.string(),
	type: ToastProps.type,
});

export type ToastObject = z.infer<typeof ToastObject>;

const MessageOnSuccess = z.object({
	detail: z.string(),
});

export type MessageOnSuccess = z.infer<typeof MessageOnSuccess>;

const SyncRolesResponse = z.object({
	roles_created: z.array(z.string()),
	roles_deleted: z.array(z.string()),
});

export type SyncRolesResponse = z.infer<typeof SyncRolesResponse>;

const CreateServerResponse = z.object({
	serverId: z.string(),
	createdAt: z.date(),
	verificationRequired: z.boolean(),
});

export type CreateServerResponse = z.infer<typeof CreateServerResponse>;

const CreateGameDBParams = z.object({
	serverId: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	categoryId: z.number().nullable().optional(),
});

export type CreateGameDBParams = z.infer<typeof CreateGameDBParams>;

export const CreateGameRequestBody = z.object({
	name: z.string(),
	description: z.string().nullable().optional(),
	categoryId: z.number().nullable().optional(),
});

const CreateGameResponse = z.object({
	gameId: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	categoryId: z.number().nullable(),
	serverId: z.string(),
	thumbnail: z.instanceof(Buffer).nullable(),
	channels: z.array(z.string()).nullable(),
});

export type CreateGameResponse = z.infer<typeof CreateGameResponse>;

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

export const UpdateGameResponse = z.object({
	updatedGame: z.object(GameWithoutRelations).nullable(),
	tags: z.object({
		added: z.array(TagRelationToGame).nullable(),
		removed: z.array(TagRelationToGame).nullable(),
	}),
	roles: z.object({
		added: z.array(RoleRelationToGame).nullable(),
		removed: z.array(RoleRelationToGame).nullable(),
	}),
});

export type UpdateGameResponse = z.infer<typeof UpdateGameResponse>;
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

export const GuildMember = z.object({
	avatarURL: z.string().nullable(),
	bannerURL: z.string().nullable(),
	displayAvatarURL: z.string().nullable(),
	displayBannerURL: z.string().nullable(),
	avatarDecorationURL: z.string().nullable(),
	roles: z.array(z.string()),
});

export type GuildMember = z.infer<typeof GuildMember> & DiscordJSGuildMember;

export const UpdateServerVerificationRequiredRequestBody = z.object({
	verificationRequired: z.boolean(),
});
