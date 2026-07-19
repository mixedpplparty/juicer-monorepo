import { queryOptions } from "@tanstack/react-query";
import type { TopicDetails } from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

async function fetchTopicDetails(
	serverId: string,
	topicId: number,
	signal: AbortSignal,
): Promise<TopicDetails> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/games/${topicId}`,
		{ signal },
		"주제 정보를 불러오지 못했습니다.",
	);
}

export const topicDetailsQueryOptions = (serverId: string, topicId: number) =>
	queryOptions({
		queryKey: ["topicDetails", serverId, topicId],
		queryFn: ({ signal }) => fetchTopicDetails(serverId, topicId, signal),
	});
