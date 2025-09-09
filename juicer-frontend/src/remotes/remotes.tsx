import axios from "axios";
import type { MyDataInServer, MyInfo } from "../types/types";

axios.defaults.withCredentials = true;

export const _fetchMyTokens = async () => {
	return axios.get(_fetchMyTokens.apiPath(), {
		withCredentials: true,
	});
};

_fetchMyTokens.apiPath = () => {
	return `${import.meta.env.VITE_BACKEND_URI}/discord/auth/me`;
};

_fetchMyTokens.query = () => {
	return {
		queryKey: ["auth"],
		queryFn: () => _fetchMyTokens(),
	};
};

export const _fetchMyInfo = async () => {
	return axios.get(_fetchMyInfo.apiPath(), {
		withCredentials: true,
	});
};

_fetchMyInfo.apiPath = () => {
	return `${import.meta.env.VITE_BACKEND_URI}/discord/user/me`;
};

_fetchMyInfo.query = () => {
	return {
		queryKey: ["myInfo"],
		queryFn: () => _fetchMyInfo(),
	};
};

export const _fetchServerData = async (serverId: string) => {
	return axios.get(_fetchServerData.apiPath(serverId), {
		withCredentials: true,
	});
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

export const _fetchMyDataInServer = async (
	serverId: string | null,
): Promise<MyDataInServer | null> => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/me`,
		{ withCredentials: true },
	);
	return _res.data;
};

export const _createServer = async (
	serverId: string | null,
): Promise<unknown> => {
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/create`,
		{ withCredentials: true },
	);
	return _res.data;
};

export const _signOut = async () => {
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
) => {
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
) => {
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
) => {
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/categories/create`,
		{ name: categoryName },
	);
	return _res.data;
};

export const _createTag = async (serverId: string, tagName: string) => {
	const _res = await axios.post(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/tags/create`,
		{ name: tagName },
	);
	return _res.data;
};

export const _deleteCategory = async (serverId: string, categoryId: number) => {
	const _res = await axios.delete(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/categories/${categoryId}`,
	);
	return _res.data;
};

export const _deleteTag = async (serverId: string, tagId: number) => {
	const _res = await axios.delete(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/tags/${tagId}`,
	);
	return _res.data;
};

export const _deleteGame = async (serverId: string, gameId: number) => {
	const _res = await axios.delete(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}`,
	);
	return _res.data;
};

export const _assignRolesToUser = async (serverId: string, gameId: number) => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}/roles/assign`,
	);
	return _res.data;
};

export const _unassignRolesFromUser = async (
	serverId: string,
	gameId: number,
) => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/games/${gameId}/roles/unassign`,
	);
	return _res.data;
};

export const _syncServerData = async (serverId: string) => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}/sync-roles`,
	);
	return _res.data;
};
