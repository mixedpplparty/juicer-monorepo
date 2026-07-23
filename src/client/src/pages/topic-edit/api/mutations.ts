import type { UpdateGameRequestBody, UpdateGameResponse } from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export interface UpdateTopicInput {
	serverId: string;
	topicId: number;
	body: UpdateGameRequestBody;
}

export async function updateTopic({
	serverId,
	topicId,
	body,
}: UpdateTopicInput): Promise<UpdateGameResponse> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/games/${topicId}`,
		{
			method: "PUT",
			json: body,
		},
		"주제를 저장하지 못했습니다.",
	);
}
