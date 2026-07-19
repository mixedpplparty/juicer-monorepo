import { queryOptions } from "@tanstack/react-query";
import type { TopicDetails } from "juicer-shared";

const backendBase = import.meta.env.VITE_BACKEND_URI;

async function fetchTopicDetails(
	serverId: string,
	topicId: number,
): Promise<TopicDetails> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/games/${topicId}`,
		{ credentials: "include" },
	);
	if (!response.ok) {
		throw new Error("주제 정보를 불러오지 못했습니다.");
	}
	return response.json();
}

export const topicDetailsQueryOptions = (serverId: string, topicId: number) =>
	queryOptions({
		queryKey: ["topicDetails", serverId, topicId],
		queryFn: () => fetchTopicDetails(serverId, topicId),
	});
