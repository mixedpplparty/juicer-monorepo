import { queryOptions } from "@tanstack/react-query";
import type { Game, MyDataInServer, ServerData } from "juicer-shared";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export async function fetchServerData(serverId: string): Promise<ServerData> {
	const response = await fetch(`${backendBase}/discord/servers/${serverId}`, {
		credentials: "include",
	});
	return response.json();
}

async function fetchMyDataInServer(serverId: string): Promise<MyDataInServer> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/me`,
		{ credentials: "include" },
	);
	return response.json();
}

async function fetchTopics(serverId: string, query: string): Promise<Game[]> {
	const searchParams = new URLSearchParams({ query });
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/search/all?${searchParams}`,
		{ credentials: "include" },
	);
	if (!response.ok) {
		throw new Error("주제 목록을 불러오지 못했습니다.");
	}
	return response.json();
}

export const serverQueryOptions = (serverId: string) =>
	queryOptions({
		queryKey: ["serverData", serverId],
		queryFn: () => fetchServerData(serverId),
	});

export const myDataInServerQueryOptions = (serverId: string) =>
	queryOptions({
		queryKey: ["myDataInServer", serverId],
		queryFn: () => fetchMyDataInServer(serverId),
	});

export const topicsQueryOptions = (serverId: string, query: string) =>
	queryOptions({
		queryKey: ["topics", serverId, query],
		queryFn: () => fetchTopics(serverId, query),
	});
