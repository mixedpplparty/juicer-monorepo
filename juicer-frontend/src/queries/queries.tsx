import axios from "axios";

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

export const _fetchMyInfo = async () => {
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

export const _fetchServerData = async (serverId: string | undefined) => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/server/${serverId}`,
		{ withCredentials: true },
	);
	return _res.data;
};
