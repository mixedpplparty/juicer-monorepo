const topicsByServer = (serverId: string) => ["topics", serverId] as const;
const topicDetailsByServer = (serverId: string) =>
	["topicDetails", serverId] as const;

export const queryKeys = {
	myInfo: ["myInfo"] as const,
	serverData: (serverId: string) => ["serverData", serverId] as const,
	myDataInServer: (serverId: string) => ["myDataInServer", serverId] as const,
	topics: {
		byServer: topicsByServer,
		list: (serverId: string, query: string) =>
			[...topicsByServer(serverId), query] as const,
	},
	topicDetails: {
		byServer: topicDetailsByServer,
		detail: (serverId: string, topicId: number) =>
			[...topicDetailsByServer(serverId), topicId] as const,
	},
};
