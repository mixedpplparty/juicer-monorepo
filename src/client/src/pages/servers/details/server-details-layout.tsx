import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Outlet } from "react-router";
import { serverQueryOptions } from "./api/queries";
import { ServerDetailsLayoutSkeleton } from "./components/loading-skeletons";
import { useRequiredServerId } from "./hooks/use-required-server-id";
import type { ServerDetailsOutletContext } from "./server-details-context";
import { serverDetailsPageStyles } from "./server-details-page.styles";

export function ServerDetailsLayout() {
	return (
		<Suspense fallback={<ServerDetailsLayoutSkeleton />}>
			<ServerDetailsDataLayout />
		</Suspense>
	);
}

function ServerDetailsDataLayout() {
	const serverId = useRequiredServerId();
	const { data: serverData } = useSuspenseQuery(serverQueryOptions(serverId));
	const context: ServerDetailsOutletContext = { serverId, serverData };

	return (
		<div css={serverDetailsPageStyles.root}>
			<Outlet context={context} />
		</div>
	);
}

export default ServerDetailsLayout;
