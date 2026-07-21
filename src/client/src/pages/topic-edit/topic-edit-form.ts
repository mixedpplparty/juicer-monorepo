import type { TopicDetails } from "juicer-shared";

export const noTopicCategoryValue = "none";

export interface TopicEditFormValues {
	name: string;
	description: string;
	categoryId: string;
	channelIds: string[];
	roleIds: string[];
}

export function normalizeIds(ids: string[]) {
	return [...new Set(ids)].toSorted();
}

export function getTopicEditDefaultValues(
	topic: TopicDetails,
): TopicEditFormValues {
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

export function normalizeTopicEditValues(
	values: TopicEditFormValues,
): TopicEditFormValues {
	return {
		name: values.name.trim(),
		description: values.description.trim(),
		categoryId: values.categoryId,
		channelIds: normalizeIds(values.channelIds),
		roleIds: normalizeIds(values.roleIds),
	};
}
