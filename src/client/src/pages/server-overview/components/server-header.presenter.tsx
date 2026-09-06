import type { ServerData } from "juicer-shared";
import type { ReactNode } from "react";
import { useScrollState } from "@/shared/browser/use-scroll-state";
export interface ServerHeaderProps {
	serverData: ServerData;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
}

function useServerHeaderModel({
	serverData,
	searchQuery,
	onSearchQueryChange,
}: ServerHeaderProps) {
	const appBarScroll = useScrollState<HTMLElement>();
	return { serverData, searchQuery, onSearchQueryChange, appBarScroll };
}
export type ServerHeaderViewModel = ReturnType<typeof useServerHeaderModel>;
export function ServerHeaderPresenter({
	children,
	...props
}: ServerHeaderProps & {
	children: (model: ServerHeaderViewModel) => ReactNode;
}) {
	const model = useServerHeaderModel(props);
	return children(model);
}
