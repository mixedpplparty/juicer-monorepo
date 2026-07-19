import { Outlet, useMatch } from "react-router";
import ServerList from "@/features/servers/components/server-list";
import { useMediaQuery } from "@/hooks/use-media-query";
import breakpoints from "@/shared/styles/breakpoints";
import { serversLayoutStyles } from "./servers-layout.styles";

export function ServersLayout() {
	const isViewingServer = useMatch("/servers/:serverId") !== null;
	const isDesktop = useMediaQuery(`(min-width: ${breakpoints.tablet})`);
	const shouldRenderServerList = isDesktop || !isViewingServer;

	return (
		<div css={serversLayoutStyles.root}>
			{shouldRenderServerList && (
				<aside>
					<ServerList />
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
