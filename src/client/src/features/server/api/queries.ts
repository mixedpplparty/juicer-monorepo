import { queryOptions } from "@tanstack/react-query";
import type {
	MyDataInServer,
	ServerData,
	TopicSearchResult,
} from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";
import { serverQueryKeys } from "@/shared/api/query-keys/server-query-keys";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export function fetchServerData(
	serverId: string,
	signal: AbortSignal,
): Promise<ServerData> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}`,
		{ signal },
		"서버 정보를 불러오지 못했습니다.",
	);
}

function fetchMyDataInServer(
	serverId: string,
	signal: AbortSignal,
): Promise<MyDataInServer> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/me`,
		{ signal },
		"내 서버 프로필을 불러오지 못했습니다.",
	);
}

function fetchTopics(
	serverId: string,
	query: string,
	signal: AbortSignal,
): Promise<TopicSearchResult[]> {
	const searchParams = new URLSearchParams({ query });
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/search/all?${searchParams}`,
		{ signal },
		"주제 목록을 불러오지 못했습니다.",
	);
}

export const serverQueryOptions = (serverId: string) =>
	queryOptions({
		queryKey: serverQueryKeys.data(serverId),
		queryFn: ({ signal }) => fetchServerData(serverId, signal),
	});

export const myDataInServerQueryOptions = (serverId: string) =>
	queryOptions({
		queryKey: serverQueryKeys.currentMember(serverId),
		queryFn: ({ signal }) => fetchMyDataInServer(serverId, signal),
	});

export const topicsQueryOptions = (serverId: string, query: string) =>
	queryOptions({
		queryKey: topicQueryKeys.lists.search(serverId, query),
		queryFn: ({ signal }) => fetchTopics(serverId, query, signal),
	});
