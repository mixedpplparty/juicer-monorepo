import { queryOptions } from "@tanstack/react-query";
import type { MyInfo } from "juicer-shared";

const backendBase = import.meta.env.VITE_BACKEND_URI;

async function fetchMyInfo(): Promise<MyInfo> {
	const response = await fetch(`${backendBase}/discord/user/me`, {
		credentials: "include",
	});
	return response.json();
}

export const myInfoQueryOptions = () =>
	queryOptions({
		queryKey: ["myInfo"],
		queryFn: fetchMyInfo,
	});
