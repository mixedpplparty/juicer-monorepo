import type { TopicSearchResult } from "juicer-shared";
import type { ReactNode } from "react";
export interface TopicListProps {
	searchQuery: string;
	topics: TopicSearchResult[];
}

function useTopicListModel({ topics, searchQuery }: TopicListProps) {
	return { topics, searchQuery };
}
export type TopicListViewModel = ReturnType<typeof useTopicListModel>;
export function TopicListPresenter({
	children,
	...props
}: TopicListProps & {
	children: (model: TopicListViewModel) => ReactNode;
}) {
	const model = useTopicListModel(props);
	return children(model);
}
