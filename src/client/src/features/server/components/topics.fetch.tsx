import { useSuspenseQuery } from "@tanstack/react-query";
import type { TopicSearchResult } from "juicer-shared";
import type { ReactNode } from "react";
import type { Refetch } from "@/shared/api/refetch";
import { topicsQueryOptions } from "../api/queries";

type Props = {
	serverId: string;
	searchQuery: string;
	children: (data: TopicSearchResult[], refetch: Refetch) => ReactNode;
};

export function TopicsFetch({ serverId, searchQuery, children }: Props) {
	const { data, refetch } = useSuspenseQuery(
		topicsQueryOptions(serverId, searchQuery),
	);
	return children(data, () => refetch({ throwOnError: true }));
}
