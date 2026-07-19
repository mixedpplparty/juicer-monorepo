import { queryOptions } from "@tanstack/react-query";
import type { MyInfo, ServerData } from "juicer-shared";

const backendBase = import.meta.env.VITE_BACKEND_URI;

async function fetchMyInfo(): Promise<MyInfo> {
	const response = await fetch(`${backendBase}/discord/user/me`, {
		credentials: "include",
	});
	return response.json();
}

async function fetchServerData(serverId: string): Promise<ServerData> {
	const response = await fetch(`${backendBase}/discord/servers/${serverId}`, {
		credentials: "include",
	});
	return response.json();
}

async function fetchMyDataInServer(serverId: string): Promise<ServerData> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/me`,
		{
			credentials: "include",
		},
	);
	return response.json();
}

export const myInfoQueryOptions = () =>
	queryOptions({
		queryKey: ["myInfo"],
		queryFn: fetchMyInfo,
	});

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
