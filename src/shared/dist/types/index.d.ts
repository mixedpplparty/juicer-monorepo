import type { GuildMember as DiscordJSGuildMember } from "discord.js";
import type { APIUser } from "discord-api-types/v10";
import * as z from "zod";
export declare const ThumbnailImage: z.ZodNullable<z.ZodOptional<z.ZodFile>>;
export type Guild = {
    id: string;
    name: string;
    icon: string | null;
    owner_id: string;
    owner_name: string;
    owner_nick: string | null;
    member_count: number;
};
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
};
export type RoleRelationToGame = {
    gameId: number;
    roleId: string;
};
export type Channel = {
    id: string;
};
export type Game = {
    gameId: number;
    serverId: string;
    name: string;
    description?: string | null;
    categoryId?: number | null;
    thumbnail: Buffer | null;
    gamesTags: TagRelationToGame[] | null;
    gamesRoles: RoleRelationToGame[] | null;
    channels: string[] | null;
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
    color: `#${string}`;
    icon: string | null;
    managed: boolean;
    meInRole: boolean;
};
export type ServerDataDiscordRole = {
    id: string;
    name: string;
    color: number[];
    display_icon: string | null;
    mention: string;
    icon: string | null;
    me_in_role: boolean;
};
export type ServerData = {
    admin: boolean;
    serverDataDb: ServerDataDb;
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
};
export type CreateGameDBParams = {
    serverId: string;
    name: string;
    description: string | null;
    categoryId: number | null;
};
export declare const CreateGameRequestBody: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, z.core.$strip>;
export type CreateGameResponse = {
    gameId: number;
    name: string;
    description: string | null;
    categoryId: number | null;
    serverId: string;
    thumbnail: Buffer | null;
    channels: string[] | null;
};
export declare const UpdateGameRequestBody: z.ZodObject<{
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    thumbnail: z.ZodNullable<z.ZodOptional<z.ZodFile>>;
    channels: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    tagIds: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
    roleIds: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
export declare const UpdateGameRequestBodyWithImageAsBuffer: z.ZodObject<{
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    thumbnail: z.ZodOptional<z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>>;
    channels: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    tagIds: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodNumber>>>;
    roleIds: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
}, z.core.$strip>;
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
export declare const DeleteGameRequestBody: z.ZodObject<{
    gameId: z.ZodNumber;
    serverId: z.ZodString;
}, z.core.$strip>;
export declare const CreateTagRequestBody: z.ZodObject<{
    serverId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const GetAllTagsInServerRequestBody: z.ZodObject<{
    serverId: z.ZodString;
}, z.core.$strip>;
export declare const DeleteTagRequestBody: z.ZodObject<{
    tagId: z.ZodNumber;
    serverId: z.ZodString;
}, z.core.$strip>;
export declare const CreateRoleInDbRequestBody: z.ZodObject<{
    serverId: z.ZodString;
    roleId: z.ZodString;
}, z.core.$strip>;
export declare const CreateCategoryRequestBody: z.ZodObject<{
    serverId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const CreateRoleCategoryRequestBody: z.ZodObject<{
    serverId: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const AddCategoryToGameRequestBody: z.ZodObject<{
    categoryId: z.ZodNumber;
}, z.core.$strip>;
export declare const ModifyTagsOfGameRequestBody: z.ZodObject<{
    tagIds: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>;
export declare const UpdateGameThumbnailRequestBody: z.ZodObject<{
    file: z.ZodNullable<z.ZodOptional<z.ZodFile>>;
}, z.core.$strip>;
export declare const NameRequiredRequestBody: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const AssignRoleCategoryToRoleRequestBody: z.ZodObject<{
    roleCategoryId: z.ZodNullable<z.ZodNumber>;
    roleId: z.ZodString;
}, z.core.$strip>;
export type GuildMember = DiscordJSGuildMember & {
    avatarURL: string | null;
    bannerURL: string | null;
    displayAvatarURL: string | null;
    displayBannerURL: string | null;
    avatarDecorationURL: string | null;
    roles: string[];
};
