import type { CreateGameResponse, SyncRolesResponse } from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

interface CreateServerResponse {
	message: string;
}

export interface CreateTopicInput {
	serverId: string;
	name: string;
	description: string | null;
	categoryId: number | null;
}

export function createServer(serverId: string): Promise<CreateServerResponse> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/create`,
		{ method: "POST" },
		"서버를 등록하지 못했습니다.",
	);
}

export function syncServerRoles(serverId: string): Promise<SyncRolesResponse> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/sync-roles`,
		{},
		"서버 데이터를 동기화하지 못했습니다.",
	);
}

export async function createTopic({
	serverId,
	name,
	description,
	categoryId,
}: CreateTopicInput): Promise<CreateGameResponse[]> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/games/create`,
		{
			method: "POST",
			json: { name, description, categoryId },
		},
		"주제를 추가하지 못했습니다.",
	);
}
