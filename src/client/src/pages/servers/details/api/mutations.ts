import type { CreateGameResponse } from "juicer-shared";
import { getErrorMessage } from "./get-error-message";

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
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/games/create`,
		{
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, description, categoryId }),
		},
	);
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "주제를 추가하지 못했습니다."),
		);
	}
	return response.json();
}
