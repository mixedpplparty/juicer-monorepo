import type { AssociableOptions, Category } from "juicer-shared";
import { noTopicCategoryValue } from "@/features/topics/model/topic-form-schema";

export function getTopicCategoryOptions(categories: Category[]) {
	return [
		{ label: "선택 안 함", value: noTopicCategoryValue },
		...categories.map((category) => ({
			label: category.name,
			value: String(category.categoryId),
		})),
	];
}
export function getTopicAssociationModel(
	associables: AssociableOptions,
	channelIds: string[],
	roleIds: string[],
) {
	const channelsById = new Map(
		associables.channels.map((channel) => [channel.id, channel]),
	);
	const rolesById = new Map(associables.roles.map((role) => [role.id, role]));
	return {
		channelOptions: associables.channels.map((channel) => ({
			id: channel.id,
			label: `#${channel.name}`,
			headline: `#${channel.name}`,
		})),
		roleOptions: associables.roles,
		selectedChannels: channelIds.flatMap((id) => {
			const channel = channelsById.get(id);
			return channel ? [{ id: channel.id, headline: `#${channel.name}` }] : [];
		}),
		selectedRoles: roleIds.flatMap((id) => {
			const role = rolesById.get(id);
			return role ? [role] : [];
		}),
	};
}
