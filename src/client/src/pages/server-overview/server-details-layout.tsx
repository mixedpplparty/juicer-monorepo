import { useQuery } from "@tanstack/react-query";
import { Outlet } from "react-router";
import { serverQueryOptions } from "./api/queries";
import { ServerDetailsLayoutSkeleton } from "./components/loading-skeletons";
import { useRequiredServerId } from "./hooks/use-required-server-id";
import type { ServerDetailsOutletContext } from "./server-details-context";
import { serverDetailsPageStyles } from "./server-details-page.styles";

// Reset the data view when navigating between servers so no local state from the
// previous server remains while the next query loads.
export function ServerDetailsLayout() {
	const serverId = useRequiredServerId();
	return <ServerDetailsDataLayout key={serverId} serverId={serverId} />;
}

interface ServerDetailsDataLayoutProps {
	serverId: string;
}

function ServerDetailsDataLayout({ serverId }: ServerDetailsDataLayoutProps) {
	const { data: serverData, error } = useQuery(serverQueryOptions(serverId));

	if (!serverData && error) {
		throw error;
	}

	if (!serverData) {
		return <ServerDetailsLayoutSkeleton />;
	}

	const context: ServerDetailsOutletContext = { serverId, serverData };

	return (
		<div css={serverDetailsPageStyles.root}>
			<Outlet context={context} />
		</div>
	);
}

export default ServerDetailsLayout;
