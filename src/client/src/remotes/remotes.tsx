import axios from "axios";
import type { APIUser } from "discord-api-types/v10";
import type {
	Game,
	MessageOnSuccess,
	MyDataInServer,
	MyInfo,
	ServerData,
	SyncRolesResponse,
} from "juicer-shared";

axios.defaults.withCredentials = true;

export const _fetchMyTokens = async (): Promise<APIUser> => {
	const _res = await axios.get(_fetchMyTokens.apiPath(), {
		withCredentials: true,
	});
	return _res.data;
};

_fetchMyTokens.apiPath = () => {
	return `${import.meta.env.VITE_BACKEND_URI}/discord/auth/me`;
};

_fetchMyTokens.query = () => {
	return {
		queryKey: ["auth"],
		queryFn: _fetchMyTokens,
		retry: 1,
	};
};

export const _fetchMyInfo = async (): Promise<MyInfo> => {
	const _res = await axios.get(_fetchMyInfo.apiPath(), {
		withCredentials: true,
	});
	return _res.data;
};

_fetchMyInfo.apiPath = () => {
	return `${import.meta.env.VITE_BACKEND_URI}/discord/user/me`;
};

_fetchMyInfo.query = () => {
	return {
		queryKey: ["myInfo"],
		queryFn: _fetchMyInfo,
	};
};

export const _fetchServerData = async (
	serverId: string,
): Promise<ServerData> => {
	const _res = await axios.get(_fetchServerData.apiPath(serverId), {
		withCredentials: true,
	});
	return _res.data;
};

_fetchServerData.apiPath = (serverId: string): string => {
	return `${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}`;
};

_fetchServerData.query = (serverId: string) => {
	return {
		queryKey: ["serverData", serverId],
		queryFn: () => _fetchServerData(serverId),
	};
};

export const _fetchSearchGamesInServer = async (
	serverId: string,
	query: string | null,
): Promise<Game[]> => {
	const _res = await axios.get(_fetchSearchGamesInServer.apiPath(serverId), {
		withCredentials: true,
		params: { query },
	});
	return _res.data;
};

_fetchSearchGamesInServer.apiPath = (serverId: string) => {
	return `${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/search/all`;
};

_fetchSearchGamesInServer.query = (serverId: string, query: string | null) => {
	return {
		queryKey: ["searchGamesInServer", serverId, query],
		queryFn: () => _fetchSearchGamesInServer(serverId, query),
	};
};

export const _fetchThumbnailsInGame = async (
	serverId: string,
	gameId: string,
): Promise<string> => {
	const _res = await axios.get(
		_fetchThumbnailsInGame.apiPath(serverId, gameId),
		{
			withCredentials: true,
			responseType: "blob",
		},
	);
	const blobUrl = URL.createObjectURL(_res.data);
	return blobUrl;
};

_fetchThumbnailsInGame.apiPath = (serverId: string, gameId: string) => {
	return `${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}/thumbnail`;
};

_fetchThumbnailsInGame.queries = (serverId: string, gameIds: string[]) => {
	return [
		...gameIds.map((gameId) => ({
			queryKey: ["thumbnailsInGame", serverId, gameId],
			queryFn: () => _fetchThumbnailsInGame(serverId, gameId),
			retry: false,
		})),
	];
};

export const _uploadThumbnailToGame = async (
	serverId: string,
	gameId: string,
	thumbnail: File,
): Promise<boolean> => {
	const formData = new FormData();
	formData.append("file", thumbnail, thumbnail.name);

	const _res = await axios.put(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}/thumbnail/upload`,
		formData,
		{
			withCredentials: true,
			headers: { "Content-Type": "multipart/form-data" },
		},
	);
	return _res.data;
};

export const _deleteThumbnailFromGame = async (
	serverId: string,
	gameId: string,
): Promise<boolean> => {
	const _res = await axios.delete(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}/thumbnail`,
	);
	return _res.data;
};

export const _fetchMyDataInServer = async (
	serverId: string | null,
): Promise<MyDataInServer> => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/me`,
		{ withCredentials: true },
	);
	return _res.data;
};

export const _createServer = async (
	serverId: string | null,
): Promise<MessageOnSuccess> => {
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/create`,
		{ withCredentials: true },
	);
	return _res.data;
};

export const _signOut = async (): Promise<MessageOnSuccess> => {
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/auth/revoke`,
		{ withCredentials: true },
	);
	return _res.data;
};

export const _createGame = async (
	serverId: string,
	gameName: string,
	gameDescription: string | null | undefined,
	gameCategory: string | null | undefined,
): Promise<number> => {
	//game ID(number) returned on success
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/create`,
		{ name: gameName, description: gameDescription, category_id: gameCategory },
		{ withCredentials: true },
	);
	return _res.data;
};

export const _updateGameWithTagsAndRoles = async (
	serverId: string,
	gameId: string,
	gameName: string,
	gameDescription: string,
	gameCategory: string,
	gameTags: number[],
	gameRoles: string[],
): Promise<boolean> => {
	//true on success
	const _res = await axios.put(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}`,
		{
			name: gameName,
			description: gameDescription,
			category_id: gameCategory,
			tag_ids: gameTags,
			role_ids: gameRoles,
		},
	);
	return _res.data;
};

export const _createCategory = async (
	serverId: string,
	categoryName: string,
): Promise<number> => {
	//category ID(number) returned on success
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/categories/create`,
		{ name: categoryName },
	);
	return _res.data;
};

export const _createTag = async (
	serverId: string,
	tagName: string,
): Promise<boolean> => {
	//true on success
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/tags/create`,
		{ name: tagName },
	);
	return _res.data;
};

export const _deleteCategory = async (
	serverId: string,
	categoryId: number,
): Promise<MessageOnSuccess> => {
	const _res = await axios.delete(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/categories/${categoryId}`,
	);
	return _res.data;
};

export const _deleteTag = async (
	serverId: string,
	tagId: number,
): Promise<boolean> => {
	//true on success
	const _res = await axios.delete(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/tags/${tagId}`,
	);
	return _res.data;
};

export const _deleteGame = async (
	serverId: string,
	gameId: number,
): Promise<boolean> => {
	//true on success
	const _res = await axios.delete(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}`,
	);
	return _res.data;
};

export const _assignRolesToUser = async (
	serverId: string,
	gameId: number,
): Promise<boolean> => {
	//true on success
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}/roles/assign`,
	);
	return _res.data;
};

export const _unassignRolesFromUser = async (
	serverId: string,
	gameId: number,
): Promise<boolean> => {
	//true on success
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}/roles/unassign`,
	);
	return _res.data;
};

export const _assignRoleByIdToUser = async (
	serverId: string,
	roleId: string,
): Promise<boolean> => {
	//true on success
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/roles/${roleId}/assign`,
	);
	return _res.data;
};

export const _unassignRoleByIdFromUser = async (
	serverId: string,
	roleId: string,
): Promise<boolean> => {
	//true on success
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/roles/${roleId}/unassign`,
	);
	return _res.data;
};

export const _syncServerData = async (
	serverId: string,
): Promise<SyncRolesResponse> => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/sync-roles`,
	);
	return _res.data;
};

export const _createRoleCategory = async (
	serverId: string,
	roleCategoryName: string,
): Promise<number> => {
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/roles/role-categories/create`,
		{ name: roleCategoryName },
	);
	return _res.data;
};

export const _deleteRoleCategory = async (
	serverId: string,
	roleCategoryId: number,
): Promise<boolean> => {
	const _res = await axios.delete(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/roles/role-categories/${roleCategoryId}`,
	);
	return _res.data;
};
