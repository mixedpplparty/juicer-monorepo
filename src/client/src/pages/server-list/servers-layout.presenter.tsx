import type { ReactNode } from "react";
import { useMatch } from "react-router";
import { useMediaQuery } from "@/shared/browser/use-media-query";
import breakpoints from "@/shared/styles/breakpoints";

export type ServersLayoutProps = Record<never, never>;
function useServersLayoutModel() {
	const isViewingServer = useMatch("/servers/:serverId/*") !== null;
	const isDesktop = useMediaQuery(`(min-width: ${breakpoints.tablet})`);
	const shouldRenderServerList = isDesktop || !isViewingServer;
	return { isViewingServer, shouldRenderServerList };
}
export type ServersLayoutViewModel = ReturnType<typeof useServersLayoutModel>;
export function ServersLayoutPresenter({
	children,
}: ServersLayoutProps & {
	children: (model: ServersLayoutViewModel) => ReactNode;
}) {
	const model = useServersLayoutModel();
	return children(model);
}
