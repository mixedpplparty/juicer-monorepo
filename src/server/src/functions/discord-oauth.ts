import axios from "axios";
import type { APIUser } from "discord.js";
import type {
	RESTPostOAuth2AccessTokenResult,
	RESTPostOAuth2AuthorizationQueryResult,
	RESTPostOAuth2TokenRevocationQuery,
} from "discord-api-types/v10";
import "dotenv/config";

const DISCORD_API_ENDPOINT = process.env.VITE_API_ENDPOINT;
const REDIRECT_URI = process.env.REDIRECT_URI;
const DISCORD_CLIENT_ID = process.env.VITE_CLIENT_ID as string;
const DISCORD_CLIENT_SECRET = process.env.CLIENT_SECRET as string;

export const getDiscordOAuthUserData = async (
	accessToken: string,
): Promise<APIUser> => {
	const response = await axios.get(`https://discordapp.com/api/users/@me`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});
	return response.data;
};

export const exchangeCode = async ({
	code,
	state,
}: RESTPostOAuth2AuthorizationQueryResult): Promise<RESTPostOAuth2AccessTokenResult> => {
	const response = await axios.post(
		`${DISCORD_API_ENDPOINT}/oauth2/token`,
		{
			grant_type: "authorization_code",
			code: code,
			redirect_uri: REDIRECT_URI,
		},
		{
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: DISCORD_CLIENT_ID,
				password: DISCORD_CLIENT_SECRET,
			},
		},
	);
	return response.data;
};

// need to confirm return type
export const refreshAuthToken = async (
	refreshToken: string,
): Promise<RESTPostOAuth2AccessTokenResult> => {
	const response = await axios.post(
		`${DISCORD_API_ENDPOINT}/oauth2/token`,
		{
			grant_type: "refresh_token",
			refresh_token: refreshToken,
		},
		{
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: DISCORD_CLIENT_ID,
				password: DISCORD_CLIENT_SECRET,
			},
		},
	);
	return response.data;
};

export const revokeToken = async ({
	token,
	token_type_hint,
}: RESTPostOAuth2TokenRevocationQuery): Promise<unknown> => {
	const response = await axios.post(
		`${DISCORD_API_ENDPOINT}/oauth2/token/revoke`,
		{
			token: token,
			token_type_hint: token_type_hint ?? "access_token",
		},
		{
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			auth: {
				username: DISCORD_CLIENT_ID,
				password: DISCORD_CLIENT_SECRET,
			},
		},
	);
	return response.data;
};
