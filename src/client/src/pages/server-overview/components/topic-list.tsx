import { TopicsFetch } from "@/features/server/components/topics.fetch";
import { TopicListPresenter } from "./topic-list.presenter";
import { TopicListView } from "./topic-list.view";
export interface TopicListProps {
	serverId: string;
	searchQuery: string;
}
export function TopicList({ serverId, searchQuery }: TopicListProps) {
	return (
		<TopicsFetch serverId={serverId} searchQuery={searchQuery}>
			{(topics) => (
				<TopicListPresenter topics={topics} searchQuery={searchQuery}>
					{(model) => <TopicListView {...model} />}
				</TopicListPresenter>
			)}
		</TopicsFetch>
	);
}
export default TopicList;
