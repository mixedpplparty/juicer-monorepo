import type { TopicDetails } from "juicer-shared";
import {
	noTopicCategoryValue,
	type TopicUpdateFormInput,
	type TopicUpdateFormOutput,
} from "@/shared/forms/form-schemas";

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

export function getTopicEditResetValues(
	values: TopicUpdateFormOutput,
): TopicUpdateFormInput {
	return {
		name: values.name,
		description: values.description ?? "",
		categoryId:
			values.categoryId === null
				? noTopicCategoryValue
				: String(values.categoryId),
		channelIds: values.channels,
		roleIds: normalizeIds(values.roleIds),
	};
}
