import { useParams } from "react-router";

export function useRequiredServerId(): string {
	const { serverId } = useParams();

	if (!serverId) {
		throw new Error("serverId is required");
	}

	return serverId;
}
