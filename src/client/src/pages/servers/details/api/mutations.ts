import type { CreateGameResponse } from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export interface CreateTopicInput {
	serverId: string;
	name: string;
	description: string | null;
	categoryId: number | null;
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
