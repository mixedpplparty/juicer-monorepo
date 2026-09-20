import { useSuspenseQueries } from "@tanstack/react-query";
import type { AssociableOptions, TopicDetails } from "juicer-shared";
import type { ReactNode } from "react";
import {
	topicAssociablesQueryOptions,
	topicDetailsQueryOptions,
} from "@/features/topics/api/queries";
import type { Refetch } from "@/shared/api/refetch";

type Props = {
	serverId: string;
	topicId: number;
	children: (data: {
		topic: TopicDetails;
		associables: AssociableOptions;
		refetchTopic: Refetch;
	}) => ReactNode;
};
export function TopicEditFetch({ serverId, topicId, children }: Props) {
	const [topic, associables] = useSuspenseQueries({
		queries: [
			topicDetailsQueryOptions(serverId, topicId),
			topicAssociablesQueryOptions(serverId),
		],
	});
	return children({
		topic: topic.data,
		associables: associables.data,
		refetchTopic: () => topic.refetch({ throwOnError: true }),
	});
}
