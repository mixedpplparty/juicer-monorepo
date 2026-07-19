import { Suspense, useState } from "react";
import { useOutletContext } from "react-router";
import { ServerOverviewSkeleton } from "./components/loading-skeletons";
import ServerHeader from "./components/server-header";
import ServerInfo from "./components/server-info";
import type { ServerDetailsOutletContext } from "./server-details-context";
import { serverDetailsPageStyles } from "./server-details-page.styles";

export function ServerDetailsPage() {
	const { serverId, serverData } =
		useOutletContext<ServerDetailsOutletContext>();
	const [searchQuery, setSearchQuery] = useState("");

	return (
		<>
			<ServerHeader
				serverData={serverData}
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
			/>
			<div css={serverDetailsPageStyles.content}>
				<Suspense fallback={<ServerOverviewSkeleton />}>
					<ServerInfo
						serverId={serverId}
						serverData={serverData}
						searchQuery={searchQuery}
					/>
				</Suspense>
			</div>
		</>
	);
}

export default ServerDetailsPage;
