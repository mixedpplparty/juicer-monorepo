import type { UpdateGameResponse } from "juicer-shared";
import { getErrorMessage } from "../../../api/get-error-message";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export interface UpdateTopicInput {
	serverId: string;
	topicId: number;
	name: string;
	description: string | null;
	channelIds: string[];
	roleIds: string[];
}

export async function updateTopic({
	serverId,
	topicId,
	name,
	description,
	channelIds,
	roleIds,
}: UpdateTopicInput): Promise<UpdateGameResponse> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/games/${topicId}`,
		{
			method: "PUT",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name,
				description,
				channels: channelIds,
				roleIds,
			}),
		},
	);
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "주제를 저장하지 못했습니다."),
		);
	}
	return response.json();
}
