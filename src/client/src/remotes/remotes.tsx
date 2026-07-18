import type { MyInfo, ServerData } from "juicer-shared";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export const _fetchMyInfo = async (): Promise<MyInfo> => {
	const response = await fetch(_fetchMyInfo.apiPath(), {
		credentials: "include",
	});
	return response.json();
};

_fetchMyInfo.apiPath = () => {
	return `${backendBase}/discord/user/me`;
};

_fetchMyInfo.query = () => {
	return {
		queryKey: ["myInfo"],
		queryFn: _fetchMyInfo,
	};
};

export const _isAuthenticated = async (request: Request): Promise<boolean> => {
	const response = await fetch(`${backendBase}/discord/auth/me`, {
		credentials: "include",
		cache: "no-store",
		signal: request.signal, // AbortSignal
	});

	if (response.status === 401) {
		return false;
	}

	if (!response.ok) {
		throw response;
	}

	return true;
};

export const _fetchServerData = async (
	serverId: string,
): Promise<ServerData> => {
	const response = await fetch(_fetchServerData.apiPath(serverId), {
		credentials: "include",
	});
	return response.json();
};

_fetchServerData.apiPath = (serverId: string): string => {
	return `${backendBase}/discord/servers/${serverId}`;
};

_fetchServerData.query = (serverId: string) => {
	return {
		queryKey: ["serverData", serverId],
		queryFn: () => _fetchServerData(serverId),
	};
};
