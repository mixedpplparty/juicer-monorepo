import axios from "axios";
axios.defaults.withCredentials = true;


export const _fetchUserData = async () => {
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

export const _fetchDiscordUserData = async () => {
	try {
		const _res = await axios.get(
			`${import.meta.env.VITE_BACKEND_URI}/discord/user-data`,
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