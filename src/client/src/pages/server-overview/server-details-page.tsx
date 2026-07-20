import { useState } from "react";
import { useOutletContext } from "react-router";
import ServerHeader from "./components/server-header";
import ServerInfo from "./components/server-info";
import type { ServerDetailsOutletContext } from "./server-details-context";
import { serverDetailsPageStyles } from "./server-details-page.styles";
import ServerRegistrationPage, {
	ServerRegistrationUnavailablePage,
} from "./server-registration-page";

export function ServerDetailsPage() {
	const { serverId, serverData } =
		useOutletContext<ServerDetailsOutletContext>();
	const [searchQuery, setSearchQuery] = useState("");

	if (!serverData.serverDataDb) {
		return serverData.admin ? (
			<ServerRegistrationPage serverId={serverId} />
		) : (
			<ServerRegistrationUnavailablePage />
		);
	}

	return (
		<>
			<ServerHeader
				serverData={serverData}
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
			/>
			<div css={serverDetailsPageStyles.content}>
				<ServerInfo
					serverId={serverId}
					serverData={serverData}
					searchQuery={searchQuery}
				/>
			</div>
		</>
	);
}

export default ServerDetailsPage;
