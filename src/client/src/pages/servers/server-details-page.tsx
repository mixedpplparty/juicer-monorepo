import { useParams } from "react-router";
import ServerInfo from "@/features/servers/components/server-info";

export function ServerDetailsPage() {
	const { serverId } = useParams();

	if (!serverId) {
		throw new Error("serverId is required");
	}

	return <ServerInfo serverId={serverId} />;
}

export default ServerDetailsPage;
