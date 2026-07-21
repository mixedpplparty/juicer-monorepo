const listsByServer = (serverId: string) => ["topics", serverId] as const;
const detailsByServer = (serverId: string) =>
	["topicDetails", serverId] as const;

export const topicQueryKeys = {
	lists: {
		byServer: listsByServer,
		search: (serverId: string, query: string) =>
			[...listsByServer(serverId), query] as const,
	},
	details: {
		byServer: detailsByServer,
		detail: (serverId: string, topicId: number) =>
			[...detailsByServer(serverId), topicId] as const,
	},
};
