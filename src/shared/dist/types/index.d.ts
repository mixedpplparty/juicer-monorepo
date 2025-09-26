import type { APIUser } from "discord-api-types/v10";
import * as z from "zod";
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
export declare const SyncRolesResponse: z.ZodObject<{
    roles_created: z.ZodArray<z.ZodString>;
    roles_deleted: z.ZodArray<z.ZodString>;
}, z.core.$strip>;
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
    description: z.ZodNullable<z.ZodString>;
    categoryId: z.ZodNullable<z.ZodNumber>;
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
    gameId: z.ZodNumber;
    serverId: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    description: z.ZodNullable<z.ZodString>;
    categoryId: z.ZodNullable<z.ZodNumber>;
    thumbnail: z.ZodNullable<z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>>;
    channels: z.ZodNullable<z.ZodArray<z.ZodString>>;
    tagIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
    roleIds: z.ZodNullable<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
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
export declare const AddTagsToGameRequestBody: z.ZodObject<{
    tagIds: z.ZodArray<z.ZodNumber>;
}, z.core.$strip>;
export declare const UpdateGameThumbnailRequestBody: z.ZodObject<{
    file: z.ZodCustom<Buffer<ArrayBufferLike>, Buffer<ArrayBufferLike>>;
}, z.core.$strip>;
export declare const NameRequiredRequestBody: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
