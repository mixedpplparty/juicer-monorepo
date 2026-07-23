export const serverQueryKeys = {
	data: (serverId: string) => ["serverData", serverId] as const,
	currentMember: (serverId: string) => ["myDataInServer", serverId] as const,
	roleSettings: (serverId: string) => ["roleSettings", serverId] as const,
};
