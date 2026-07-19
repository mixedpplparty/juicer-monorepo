import { queryOptions } from "@tanstack/react-query";
import type { MyInfo } from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

function fetchMyInfo(signal: AbortSignal): Promise<MyInfo> {
	return fetchJson(
		`${backendBase}/discord/user/me`,
		{ signal },
		"서버 목록을 불러오지 못했습니다.",
	);
}

export const myInfoQueryOptions = () =>
	queryOptions({
		queryKey: ["myInfo"],
		queryFn: ({ signal }) => fetchMyInfo(signal),
	});
