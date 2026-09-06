import { Suspense } from "react";
import { Outlet } from "react-router";
import ServerList from "@/pages/server-list/components/server-list";
import { ServerListSkeleton } from "@/pages/server-list/components/server-list-skeleton";
import type { ServersLayoutViewModel } from "./servers-layout.presenter";
import { serversLayoutStyles } from "./servers-layout.styles";
export function ServersLayoutView({
	isViewingServer,
	shouldRenderServerList,
}: ServersLayoutViewModel) {
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
