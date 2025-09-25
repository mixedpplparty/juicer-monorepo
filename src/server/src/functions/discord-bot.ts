import type {
	APIUser,
	Collection,
	Client as DiscordClient,
	Guild,
	GuildMember,
	Role,
	Snowflake,
} from "discord.js";
import {
	Client,
	Events,
	GatewayIntentBits,
	PermissionFlagsBits,
} from "discord.js";
import "dotenv/config";
import { HTTPException } from "hono/http-exception";
import type { FilteredGuild, SyncRolesResponse } from "juicer-shared";
import {
	createRoleInDb,
	deleteRoleFromDb,
	getAllRolesInServerInDb,
	getRoleInServerInDbByRoleIds,
} from "./db.js";
import { getDiscordOAuthUserData } from "./discord-oauth.js";

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
): Promise<{
	member: GuildMember;
	guild: Guild;
	manageGuildPermission: boolean;
}> => {
	let userData: APIUser;
	try {
		userData = await getDiscordOAuthUserData(accessToken);
	} catch (error) {
		throw new HTTPException(401, { message: "Most likely not authenticated." });
	}
	const guild = await discordClient.guilds.fetch(serverId);
	if (!guild) {
		throw new HTTPException(404, {
			message: "Server not found. Bot may not be in that server.",
		});
	}
	const member: GuildMember = await guild.members.fetch(userData.id);
	if (!member) {
		throw new HTTPException(404, { message: "User not in server." });
	}
	if (
		requireManageGuildPermissions &&
		!member.permissions.has(PermissionFlagsBits.ManageGuild)
	) {
		throw new HTTPException(403, {
			message: "User does not have manage server permission in that server.",
		});
	}
	return {
		member,
		guild,
		manageGuildPermission: member.permissions.has(
			PermissionFlagsBits.ManageGuild,
		),
	};
};
// MUST authenticate before using
export const getAllServersUserAndBotAreIn = async (userId: string) => {
	const guildsBotIsIn = await discordClient.guilds.fetch();
	const returnGuilds: FilteredGuild[] = [];
	for (const [_, partialGuild] of guildsBotIsIn) {
		const guild = await partialGuild.fetch();
		const member = await guild.members.fetch(userId); //userId can be string
		const owner = await guild.fetchOwner();
		if (member) {
			returnGuilds.push({
				id: guild.id,
				name: guild.name,
				icon: guild.iconURL() ?? null,
				ownerId: guild.ownerId,
				ownerName: owner.displayName,
				ownerNick: owner.nickname ?? undefined,
				memberCount: guild.memberCount,
			});
		}
	}
	return returnGuilds;
};

// MUST authenticate before using
// MUST check if role is self-assignable on the DB side
// needs to be tested - can we fetch guild only with serverId?
export const assignRolesToUser = async (
	serverId: string,
	userId: string,
	roleIds: string[],
) => {
	const guild = await discordClient.guilds.fetch(serverId);
	const roles = await getRoleInServerInDbByRoleIds({ serverId, roleIds });
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
// MUST check if role is self-assignable on the DB side
// needs to be tested - can we fetch guild only with serverId?
export const unassignRolesFromUser = async (
	serverId: string,
	userId: string,
	roleIds: string[],
) => {
	const guild = await discordClient.guilds.fetch(serverId);
	const roles = await getRoleInServerInDbByRoleIds({ serverId, roleIds });
	for (const role of roles) {
		const roleObj = await guild.roles.fetch(role.roleId);
		if (roleObj && roleObj.name !== "@everyone") {
			await guild.members.fetch(userId).then((member) => {
				member.roles.remove(roleObj);
			});
		}
	}
};

export const syncRolesWithDbAndDiscord = async (
	serverId: string,
): Promise<SyncRolesResponse> => {
	const guild = await discordClient.guilds.fetch(serverId);
	const roles = await guild.roles.fetch();
	const dbRoles = await getAllRolesInServerInDb({ serverId });
	const diff = { roles_created: [], roles_deleted: [] } as SyncRolesResponse;
	//prioritize discord side
	roles.forEach(async (role) => {
		if (dbRoles.find((dbRole) => dbRole.roleId !== role.id)) {
			await createRoleInDb({ serverId, roleId: role.id });
			diff.roles_created.push(role.id);
		}
	});
	dbRoles.forEach(async (dbRole) => {
		if (roles.find((role) => role.id !== dbRole.roleId)) {
			await deleteRoleFromDb({ serverId, roleId: dbRole.roleId });
			diff.roles_deleted.push(dbRole.roleId);
		}
	});
	return diff;
};

export const getAllRolesInServerInDiscordApi = async (
	serverId: string,
): Promise<Collection<Snowflake, Role>> => {
	const guild = await discordClient.guilds.fetch(serverId);
	const roles = await guild.roles.fetch();
	return roles;
};

// MUST authenticate before using
export const getMyDataInServerInDiscordApi = async (
	serverId: string,
	userId: string,
): Promise<GuildMember> => {
	const guild = await discordClient.guilds.fetch(serverId);
	const member = await guild.members.fetch(userId);
	return member;
};
