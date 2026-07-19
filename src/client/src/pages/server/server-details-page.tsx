import { useParams } from "react-router";
import { ServerInfo } from "../../components/dashboard/server-details";
import { serverDetailsContainerStyles } from "./styles";

export function ServerDetailsPage() {
	const { serverId } = useParams();

	if (!serverId) {
		throw new Error("serverId is required");
	}

	return (
		<div css={serverDetailsContainerStyles}>
			<ServerInfo serverId={serverId} />
		</div>
	);
}

export default ServerDetailsPage;
