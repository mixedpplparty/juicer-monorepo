import type { APIUser } from "discord-api-types/v10";

export type Guild = {
	id: string;
	name: string;
	icon: string | null;
	owner_id: string;
	owner_name: string;
	owner_nick: string | null; // nick is server-specific. optional
	member_count: number;
};

export type MyInfo = {
	me: APIUser;
	guilds: Guild[];
};

export type ServerDataDb = {
	server_id: string;
	roles: string[];
	categories: number[];
	tags: number[];
	games: number[];
};

export type ServerDataDiscord = {
	id: string;
	name: string;
	icon: string | null;
	owner_id: string;
	owner_name: string;
	owner_nick: string | null;
	member_count: number;
};

export type ServerData = {
	admin: boolean;
	server_data_db: ServerDataDb;
	server_data_discord: ServerDataDiscord;
};
