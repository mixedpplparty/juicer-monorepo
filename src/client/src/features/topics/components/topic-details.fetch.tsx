import { useSuspenseQuery } from "@tanstack/react-query";
import type { TopicDetails } from "juicer-shared";
import type { ReactNode } from "react";
import type { Refetch } from "@/shared/api/refetch";
import { topicDetailsQueryOptions } from "../api/queries";

type Props = {
	serverId: string;
	topicId: number;
	children: (data: TopicDetails, refetch: Refetch) => ReactNode;
};

export function TopicDetailsFetch({ serverId, topicId, children }: Props) {
	const { data, refetch } = useSuspenseQuery(
		topicDetailsQueryOptions(serverId, topicId),
	);
	return children(data, () => refetch({ throwOnError: true }));
}
