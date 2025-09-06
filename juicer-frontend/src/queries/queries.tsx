import axios from "axios";
axios.defaults.withCredentials = true;


export const _fetchUserData = async () => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/auth/me`,
		{ withCredentials: true },
	);
	return _res.data;
};

export const _fetchDiscordUserData = async () => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/user-data`,
		{ withCredentials: true },
	);
	return _res.data;
};