import axios from "axios";
import qs from "qs";

axios.defaults.withCredentials = true;

//not used
export const _fetchExchangeToken = async (_code: string | null) => {
	if (!_code) {
		throw new Error("code not given while processing fetchExchangeToken");
	}
	const _apiEndpoint = `${import.meta.env.VITE_API_ENDPOINT}/oauth2/token`;
	const _data = qs.stringify({
		grant_type: "authorization_code",
		code: _code,
		redirect_uri: import.meta.env.VITE_REDIRECT_AFTER_USER_AUTH_URI,
		client_id: import.meta.env.VITE_CLIENT_ID,
		client_secret: import.meta.env.VITE_CLIENT_SECRET,
	});
	const _options = {
		method: "POST",
		headers: { "content-type": "application/x-www-form-urlencoded" },
		data: _data,
		url: _apiEndpoint,
	};
	const _res = await axios(_options);
	return _res.data;
};

export const _fetchUserData = async () => {
	const _res = await axios.get(
		`${import.meta.env.VITE_BACKEND_URI}/discord/auth/me`,
		{ withCredentials: true },
	);
	return _res.data;
};
