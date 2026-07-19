import type { ServerData } from "juicer-shared";

export interface ServerDetailsOutletContext {
	serverId: string;
	serverData: ServerData;
	searchQuery: string;
}
