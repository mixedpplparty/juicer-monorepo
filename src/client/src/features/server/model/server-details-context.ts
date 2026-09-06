import type { ServerData } from "juicer-shared";
import type { Refetch } from "@/shared/api/refetch";

export interface ServerDetailsOutletContext {
	serverId: string;
	serverData: ServerData;
	refetchServer: Refetch;
}
