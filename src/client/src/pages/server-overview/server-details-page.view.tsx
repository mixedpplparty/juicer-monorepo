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
	searchText,
	searchQuery,
	handleSearchChange,
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
				searchQuery={searchText}
				onSearchQueryChange={handleSearchChange}
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
