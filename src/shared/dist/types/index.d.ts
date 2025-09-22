import type { APIUser } from "discord-api-types/v10";
export type Guild = {
    id: string;
    name: string;
    icon: string | null;
    owner_id: string;
    owner_name: string;
    owner_nick: string | null;
    member_count: number;
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
    id: number;
    name: string;
};
export type TagId = {
    id: number;
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
export type SyncRolesResponse = {
    roles_created: string[];
    roles_deleted: string[];
};
export type CreateServerResponse = {
    serverId: string;
    createdAt: Date;
};
export type CreateGameRequestBody = {
    serverId: string;
    name: string;
    description: string | null;
    categoryId: number | null;
};
export type CreateGameResponse = {
    gameId: number;
    name: string;
    description: string | null;
    categoryId: number | null;
    serverId: string;
    thumbnail: Buffer | null;
    channels: string[] | null;
};
