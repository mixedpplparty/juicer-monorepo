import type { TopicDetails } from "juicer-shared";
import {
	noTopicCategoryValue,
	type TopicUpdateFormInput,
} from "@/features/topics/model/topic-form-schema";

export function normalizeIds(ids: string[]) {
	return [...new Set(ids)].toSorted();
}

export function getTopicEditDefaultValues(
	topic: TopicDetails,
): TopicUpdateFormInput {
	return {
		name: topic.name,
		description: topic.description ?? "",
		categoryId:
			topic.category?.categoryId === undefined
				? noTopicCategoryValue
				: String(topic.category.categoryId),
		channelIds: normalizeIds(topic.channels.map((channel) => channel.id)),
		roleIds: normalizeIds(topic.roles.map((role) => role.id)),
	};
}
