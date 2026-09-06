import { TopicsFetch } from "@/features/server/components/topics.fetch";
import type { TopicAddDialogProps } from "./topic-add-dialog";
import TopicAddDialog from "./topic-add-dialog";

export function TopicAddSection({
	searchQuery,
	...props
}: Omit<TopicAddDialogProps, "refetchTopics"> & { searchQuery: string }) {
	return (
		<TopicsFetch serverId={props.serverId} searchQuery={searchQuery}>
			{(_, refetchTopics) => (
				<TopicAddDialog {...props} refetchTopics={refetchTopics} />
			)}
		</TopicsFetch>
	);
}
