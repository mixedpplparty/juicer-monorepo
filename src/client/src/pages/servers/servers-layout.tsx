import { Suspense } from "react";
import { Outlet, useMatch } from "react-router";
import ServerList from "@/pages/servers/list/components/server-list";
import { ServerListSkeleton } from "@/pages/servers/list/components/server-list-skeleton";
import breakpoints from "@/shared/styles/breakpoints";
import { useMediaQuery } from "./hooks/use-media-query";
import { serversLayoutStyles } from "./servers-layout.styles";

export function ServersLayout() {
	const isViewingServer = useMatch("/servers/:serverId/*") !== null;
	const isDesktop = useMediaQuery(`(min-width: ${breakpoints.tablet})`);
	const shouldRenderServerList = isDesktop || !isViewingServer;

	return (
		<div css={serversLayoutStyles.root}>
			{shouldRenderServerList && (
				<aside aria-label="서버 탐색">
					<Suspense fallback={<ServerListSkeleton />}>
						<ServerList />
					</Suspense>
				</aside>
			)}

			<main
				css={[
					serversLayoutStyles.content,
					!isViewingServer && serversLayoutStyles.contentHiddenOnMobile,
				]}
			>
				<Outlet />
			</main>
		</div>
	);
}

export default ServersLayout;
