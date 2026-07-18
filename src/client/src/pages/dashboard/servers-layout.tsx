import { Outlet, useMatch } from "react-router";
import { ServerList } from "../../components/dashboard/server-list";
import breakpoints from "../../constants/breakpoints";

export function ServersLayout() {
	const isViewingServer = Boolean(useMatch("/servers/:serverId"));

	return (
		<div
			css={{
				display: "grid",
				minHeight: "100dvh",
				[`@media (min-width: ${breakpoints.tablet})`]: {
					gridTemplateColumns: "20rem minmax(0, 1fr)",
				},
			}}
		>
			<aside
				css={{
					display: isViewingServer ? "none" : "block",
					overflow: "auto",
					[`@media (min-width: ${breakpoints.tablet})`]: {
						position: "sticky",
						top: 0,
						display: "block",
						height: "100dvh",
					},
				}}
			>
				<ServerList />
			</aside>

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
