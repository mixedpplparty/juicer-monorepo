import { useParams } from "react-router";
import ServerInfo from "@/features/servers/components/server-info";
import { serverDetailsPageStyles } from "./server-details-page.styles";

export function ServerDetailsPage() {
	const { serverId } = useParams();

	if (!serverId) {
		throw new Error("serverId is required");
	}

	return (
		<div css={serverDetailsPageStyles.root}>
			<ServerInfo serverId={serverId} />
		</div>
	);
}

export default ServerDetailsPage;
