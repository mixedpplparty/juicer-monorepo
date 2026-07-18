import { Outlet, useMatch } from "react-router";
import { ServerList } from "../../components/dashboard/server-list";
import breakpoints from "../../constants/breakpoints";
import { useMediaQuery } from "../../hooks/use-media-query";

export function ServersLayout() {
	const isViewingServer = useMatch("/servers/:serverId") !== null;
	const isDesktop = useMediaQuery(`(min-width: ${breakpoints.tablet})`);
	const shouldRenderServerList = isDesktop || !isViewingServer;

	return (
		<div
			css={{
				display: "grid",
				minHeight: "100%",
				[`@media (min-width: ${breakpoints.tablet})`]: {
					gridTemplateColumns: "20rem minmax(0, 1fr)",
				},
			}}
		>
			{shouldRenderServerList && (
				<aside>
					<ServerList />
				</aside>
			)}

			<main
				css={{
					display: isViewingServer ? "block" : "none",
					minWidth: 0,
					[`@media (min-width: ${breakpoints.tablet})`]: {
						display: "block",
						overflow: "auto",
					},
				}}
			>
				<Outlet />
			</main>
		</div>
	);
}

export default ServersLayout;
