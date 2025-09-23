import type { Client as DiscordClient, Guild } from "discord.js";
import {
	Client,
	Events,
	GatewayIntentBits,
	PermissionFlagsBits,
} from "discord.js";
import "dotenv/config";
import { getRoleInServerInDbByRoleId } from "./db.ts";

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export const discordClient = new Client({
	intents: [GatewayIntentBits.Guilds],
});
discordClient.once(Events.ClientReady, (readyClient: DiscordClient) => {
	console.log(`Ready! Logged in as ${readyClient.user?.tag}`);
});
// Log in to Discord with your client's token
discordClient.login(DISCORD_BOT_TOKEN);

export const authenticateAndAuthorizeUser = async (
	serverId: string,
	accessToken: string,
	requireManageGuildPermissions: boolean = false,
) => {
	const userData = await discordClient.users.fetch(accessToken);
	const guild = await discordClient.guilds.fetch(serverId);
	if (!guild) {
		throw new Error("Server not found. Bot may not be in that server.");
	}
	const member = await guild.members.fetch(userData.id);
	if (!member) {
		throw new Error("User not in server.");
	}
	if (
		requireManageGuildPermissions &&
		!member.permissions.has(PermissionFlagsBits.ManageGuild)
	) {
		throw new Error(
			"User does not have manage server permission in that server.",
		);
	}
	return { userData, guild };
};
// MUST authenticate before using
export const getAllServersUserAndBotAreIn = async (userId: string) => {
	const guildsBotIsIn = await discordClient.guilds.fetch();
	const returnGuilds: Guild[] = [];
	for (const [_, partialGuild] of guildsBotIsIn) {
		const guild = await partialGuild.fetch();
		const member = await guild.members.fetch(userId); //userId can be string
		if (member) {
			returnGuilds.push(guild);
		}
	}
	return returnGuilds;
};

// MUST authenticate before using
// needs to be tested - can we fetch guild only with serverId?
export const assignRolesToUser = async (
	serverId: string,
	userId: string,
	roleIds: string[],
) => {
	const guild = await discordClient.guilds.fetch(serverId);
	const roles = await getRoleInServerInDbByRoleId({ serverId, roleIds });
	for (const role of roles) {
		const roleObj = await guild.roles.fetch(role.roleId);
		if (roleObj && roleObj.name !== "@everyone") {
			await guild.members.fetch(userId).then((member) => {
				member.roles.add(roleObj);
			});
		}
	}
};

// MUST authenticate before using
// needs to be tested - can we fetch guild only with serverId?
export const unassignRolesFromUser = async (
	serverId: string,
	userId: string,
	roleIds: string[],
) => {
	const guild = await discordClient.guilds.fetch(serverId);
	const roles = await getRoleInServerInDbByRoleId({ serverId, roleIds });
	for (const role of roles) {
		const roleObj = await guild.roles.fetch(role.roleId);
		if (roleObj && roleObj.name !== "@everyone") {
			await guild.members.fetch(userId).then((member) => {
				member.roles.remove(roleObj);
			});
		}
	}
};
