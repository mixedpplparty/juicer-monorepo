import { useOutletContext } from "react-router";
import ServerInfo from "@/features/servers/components/server-info";
import type { ServerDetailsOutletContext } from "./server-details-layout";

export function ServerDetailsPage() {
	const { serverId, serverData, searchQuery } =
		useOutletContext<ServerDetailsOutletContext>();

	return (
		<ServerInfo
			serverId={serverId}
			serverData={serverData}
			searchQuery={searchQuery}
		/>
	);
}

export default ServerDetailsPage;
