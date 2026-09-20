import type { FilteredGuild } from "juicer-shared";
import type { ReactNode } from "react";
export interface ServerListNavigationProps {
	guilds: FilteredGuild[];
	selectedServerId?: string;
}

function useServerListNavigationModel({
	guilds,
	selectedServerId,
}: ServerListNavigationProps) {
	const servers = guilds.map((guild) => ({
		...guild,
		selected: selectedServerId === guild.id,
		initials: guild.name.substring(0, 2),
		ownerText: `by ${guild.ownerName}`,
	}));
	const installUrl = import.meta.env.VITE_BOT_INSTALL_URI;
	return { servers, installUrl };
}
export type ServerListNavigationViewModel = ReturnType<
	typeof useServerListNavigationModel
>;
export function ServerListNavigationPresenter({
	children,
	...props
}: ServerListNavigationProps & {
	children: (model: ServerListNavigationViewModel) => ReactNode;
}) {
	const model = useServerListNavigationModel(props);
	return children(model);
}
