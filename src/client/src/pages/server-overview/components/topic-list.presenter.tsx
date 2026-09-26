import type { TopicSearchResult } from "juicer-shared";
import type { ReactNode } from "react";
import { useState } from "react";
export interface TopicListProps {
	searchQuery: string;
	topics: TopicSearchResult[];
}

function useTopicListModel({ topics, searchQuery }: TopicListProps) {
	const [showOnlyTopicsWithRoles, setShowOnlyTopicsWithRoles] = useState(false);
	const sortedTopics = [...topics].sort((a, b) =>
		a.name.localeCompare(b.name, "ko"),
	);
	const filteredTopics = showOnlyTopicsWithRoles
		? sortedTopics.filter((topic) => topic.roles.length > 0)
		: sortedTopics;
	return {
		topics: filteredTopics,
		searchQuery,
		showOnlyTopicsWithRoles,
		handleShowOnlyTopicsWithRolesChange: setShowOnlyTopicsWithRoles,
	};
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
