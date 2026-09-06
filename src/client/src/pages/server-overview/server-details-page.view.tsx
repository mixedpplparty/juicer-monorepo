import { serverDetailsPageStyles } from "@/features/server/components/server-layout.styles";
import ServerHeader from "./components/server-header";
import ServerInfo from "./components/server-info";
import type { ServerDetailsPageViewModel } from "./server-details-page.presenter";
import ServerRegistrationPage, {
	ServerRegistrationUnavailablePage,
} from "./server-registration-page";
export function ServerDetailsPageView({
	refetchServer,
	serverId,
	serverData,
	searchQuery,
	normalizedSearchQuery,
	handleSearchQueryChange,
}: ServerDetailsPageViewModel) {
	if (!serverData.serverDataDb) {
		return serverData.admin ? (
			<ServerRegistrationPage
				serverId={serverId}
				refetchServer={refetchServer}
			/>
		) : (
			<ServerRegistrationUnavailablePage />
		);
	}
	return (
		<>
			<ServerHeader
				serverData={serverData}
				searchQuery={searchQuery}
				onSearchQueryChange={handleSearchQueryChange}
			/>
			<div css={serverDetailsPageStyles.content}>
				<ServerInfo
					serverId={serverId}
					serverData={serverData}
					searchQuery={normalizedSearchQuery}
				/>
			</div>
		</>
	);
}
