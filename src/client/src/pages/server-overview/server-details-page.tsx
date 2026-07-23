import { useOutletContext, useSearchParams } from "react-router";
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
	const [searchParams, setSearchParams] = useSearchParams();
	const searchQuery = searchParams.get("query") ?? "";
	const normalizedSearchQuery = searchQuery.trim();

	const handleSearchQueryChange = (query: string) => {
		setSearchParams(
			(currentSearchParams) => {
				const nextSearchParams = new URLSearchParams(currentSearchParams);
				if (query) {
					nextSearchParams.set("query", query);
				} else {
					nextSearchParams.delete("query");
				}
				return nextSearchParams;
			},
			{ replace: true },
		);
	};

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

export default ServerDetailsPage;
