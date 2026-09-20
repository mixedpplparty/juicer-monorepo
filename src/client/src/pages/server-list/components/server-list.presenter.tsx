import type { MyInfo } from "juicer-shared";
import type { ReactNode } from "react";
import { useParams } from "react-router";
import { useScrollState } from "@/shared/browser/use-scroll-state";
export interface ServerListProps {
	myData: MyInfo;
}

function useServerListModel({ myData }: ServerListProps) {
	const { serverId } = useParams();
	const appBarScroll = useScrollState<HTMLElement>();
	return { myData, serverId, appBarScroll };
}
export type ServerListViewModel = ReturnType<typeof useServerListModel>;
export function ServerListPresenter({
	children,
	...props
}: ServerListProps & {
	children: (model: ServerListViewModel) => ReactNode;
}) {
	const model = useServerListModel(props);
	return children(model);
}
