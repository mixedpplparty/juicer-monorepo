import type { UpdateGameResponse } from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export interface UpdateTopicInput {
	serverId: string;
	topicId: number;
	name: string;
	description: string | null;
	categoryId: number | null;
	channelIds: string[];
	roleIds: string[];
}

export async function updateTopic({
	serverId,
	topicId,
	name,
	description,
	categoryId,
	channelIds,
	roleIds,
}: UpdateTopicInput): Promise<UpdateGameResponse> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/games/${topicId}`,
		{
			method: "PUT",
			json: {
				name,
				description,
				categoryId,
				channels: channelIds,
				roleIds,
			},
		},
		"주제를 저장하지 못했습니다.",
	);
}
