import type { QueryClient } from "@tanstack/react-query";
import { serverQueryKeys } from "./query-keys/server-query-keys";
import { topicQueryKeys } from "./query-keys/topic-query-keys";

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
			queryKey: serverQueryKeys.data(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: serverQueryKeys.currentMember(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: topicQueryKeys.lists.byServer(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: topicQueryKeys.details.byServer(serverId),
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
			queryKey: serverQueryKeys.data(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: topicQueryKeys.lists.byServer(serverId),
		}),
		queryClient.invalidateQueries({
			queryKey: topicQueryKeys.details.byServer(serverId),
		}),
	]);
}
