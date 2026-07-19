import type { Game, ServerData } from "juicer-shared";
import { useMemo } from "react";

export interface TopicListItemData {
	gameId: number;
	name: string;
	channels: {
		id: string;
		name: string;
	}[];
	roles: {
		id: string;
		name: string;
		color: string;
		active: boolean;
	}[];
}

export function useTopicListItems(
	topics: Game[],
	serverData: ServerData,
): TopicListItemData[] {
	const channels = serverData.serverDataDiscord.channels;
	const roles = serverData.serverDataDiscord.roles;

	return useMemo(() => {
		const channelsById = new Map(
			channels?.map((channel) => [channel.id, channel]) ?? [],
		);
		const rolesById = new Map(roles?.map((role) => [role.id, role]) ?? []);

		return topics.map((topic) => ({
			gameId: topic.gameId,
			name: topic.name,
			channels:
				topic.channels?.map((channelId) => ({
					id: channelId,
					name: channelsById.get(channelId)?.name ?? "채널 이름 없음",
				})) ?? [],
			roles:
				topic.gamesRoles?.map(({ roleId }) => {
					const role = rolesById.get(roleId);

					return {
						id: roleId,
						name: role?.name ?? "역할 이름 없음",
						color: role?.color ?? "#000000",
						active: role?.meInRole ?? false,
					};
				}) ?? [],
		}));
	}, [channels, roles, topics]);
}
