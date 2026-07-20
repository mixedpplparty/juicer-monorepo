import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";

/**
 * Invalidates every view derived from Discord role membership or role metadata.
 *
 * A role change can affect the server snapshot (`meInRole`), the member profile,
 * topic-list role indicators, and topic-detail assignment controls.
 */
export function invalidateServerRoleState(
	queryClient: QueryClient,
	serverId: string,
) {
	return Promise.all([
		queryClient.invalidateQueries({
			queryKey: queryKeys.serverData(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: queryKeys.myDataInServer(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: queryKeys.topics.byServer(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: queryKeys.topicDetails.byServer(serverId),
		}),
	]);
}

/**
 * Invalidates topic data after category metadata changes.
 */
export function invalidateServerTopicState(
	queryClient: QueryClient,
	serverId: string,
) {
	return Promise.all([
		queryClient.invalidateQueries({
			queryKey: queryKeys.serverData(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: queryKeys.topics.byServer(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: queryKeys.topicDetails.byServer(serverId),
		}),
	]);
}
