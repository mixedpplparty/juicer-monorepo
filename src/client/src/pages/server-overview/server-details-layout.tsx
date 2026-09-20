import { Suspense } from "react";
import { Outlet } from "react-router";
import { ServerDetailsLayoutSkeleton } from "@/features/server/components/loading-skeletons";
import { ServerDataFetch } from "@/features/server/components/server-data.fetch";
import { serverDetailsPageStyles } from "@/features/server/components/server-layout.styles";
import type { ServerDetailsOutletContext } from "@/features/server/model/server-details-context";
import { useRequiredServerId } from "@/features/server/model/use-required-server-id";

export function ServerDetailsLayout() {
	const serverId = useRequiredServerId();
	return (
		<Suspense key={serverId} fallback={<ServerDetailsLayoutSkeleton />}>
			<ServerDataFetch serverId={serverId}>
				{(serverData, refetchServer) => (
					<div css={serverDetailsPageStyles.root}>
						<Outlet
							context={
								{
									serverId,
									serverData,
									refetchServer,
								} satisfies ServerDetailsOutletContext
							}
						/>
					</div>
				)}
			</ServerDataFetch>
		</Suspense>
	);
}
export default ServerDetailsLayout;
