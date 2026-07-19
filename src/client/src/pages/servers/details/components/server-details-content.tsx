import { useOutletContext } from "react-router";
import type { ServerDetailsOutletContext } from "../server-details-context";
import ServerInfo from "./server-info";

export function ServerDetailsContent() {
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

export default ServerDetailsContent;
