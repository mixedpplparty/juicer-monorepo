import type { ServerData } from "juicer-shared";
import type { ReactNode } from "react";
import { useState } from "react";
import { useDebouncedValue } from "../hooks/use-debounced-value";
export interface ServerInfoProps {
	serverId: string;
	serverData: ServerData;
	searchQuery: string;
}

function useServerInfoModel({
	serverId,
	serverData,
	searchQuery,
}: ServerInfoProps) {
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
	const [isTopicAddDialogOpen, setIsTopicAddDialogOpen] = useState(false);
	return {
		serverId,
		serverData,
		debouncedSearchQuery,
		isTopicAddDialogOpen,
		setIsTopicAddDialogOpen,
	};
}
export type ServerInfoViewModel = ReturnType<typeof useServerInfoModel>;
export function ServerInfoPresenter({
	children,
	...props
}: ServerInfoProps & {
	children: (model: ServerInfoViewModel) => ReactNode;
}) {
	const model = useServerInfoModel(props);
	return children(model);
}
