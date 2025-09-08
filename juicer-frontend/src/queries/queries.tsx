import axios from "axios";
import type { MyInfo, ServerData } from "../types/types";

axios.defaults.withCredentials = true;

export const _fetchMyTokens = async () => {
	try {
		const _res = await axios.get(
			`${import.meta.env.VITE_BACKEND_URI}/discord/auth/me`,
			{ withCredentials: true },
		);
		return _res.data;
	} catch (error) {
		// return null on 401 - reauthenticate
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			return null;
		}
		throw error;
	}
};

export const _fetchMyInfo = async (): Promise<MyInfo | null> => {
	try {
		const _res = await axios.get(
			`${import.meta.env.VITE_BACKEND_URI}/discord/user/me`,
			{ withCredentials: true },
		);
		return _res.data;
	} catch (error) {
		// return null on 401 - reauthenticate
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			return null;
		}
		throw error;
	}
};

export const _fetchServerData = async (
	serverId: string | null,
): Promise<ServerData | null> => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}`,
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
