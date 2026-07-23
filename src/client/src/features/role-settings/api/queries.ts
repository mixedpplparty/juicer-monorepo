import { queryOptions } from "@tanstack/react-query";
import type { RoleSettingsView } from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";
import { serverQueryKeys } from "@/shared/api/query-keys/server-query-keys";

const backendBase = import.meta.env.VITE_BACKEND_URI;

function fetchRoleSettings(
	serverId: string,
	signal: AbortSignal,
): Promise<RoleSettingsView> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/roles/settings`,
		{ signal },
		"역할 설정을 불러오지 못했습니다.",
	);
}

export const roleSettingsQueryOptions = (serverId: string) =>
	queryOptions({
		queryKey: serverQueryKeys.roleSettings(serverId),
		queryFn: ({ signal }) => fetchRoleSettings(serverId, signal),
	});
