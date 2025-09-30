import type {
	Collection,
	Client as DiscordClient,
	GuildMember,
	Role,
	Snowflake,
} from "discord.js";
import {
	Client,
	DiscordAPIError,
	Events,
	GatewayIntentBits,
	PermissionFlagsBits,
} from "discord.js";
import "dotenv/config";
import { HTTPException } from "hono/http-exception";
import type {
	FilteredGuild,
	FilteredServerDataDiscord,
	SyncRolesResponse,
} from "juicer-shared/dist/types/index.js";
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
	guild: FilteredServerDataDiscord;
	manageGuildPermission: boolean;
}> => {
	const userData = await getDiscordOAuthUserData(accessToken);
	const guild = await discordClient.guilds.fetch({
		guild: serverId,
		force: true,
	});
	if (!guild) {
		throw new HTTPException(404, {
			message: "Server not found. Bot may not be in that server.",
		});
	}
	const owner = await guild.fetchOwner();
	const filteredServerDataDiscord = {
		id: guild.id,
		name: guild.name,
		icon: guild.iconURL() ?? null,
		ownerId: guild.ownerId,
		ownerName: owner.displayName,
		ownerNick: owner.nickname ?? null,
		memberCount: guild.memberCount,
		roles: await guild.roles.fetch().then((roles) => {
			return roles.map((role) => ({
				id: role.id,
				name: role.name,
				color: role.hexColor,
				icon: role.iconURL() ?? null,
				managed: role.managed,
				meInRole: role.members.has(userData.id),
			}));
		}),
	};
	const member: GuildMember = await guild.members.fetch({
		user: userData.id,
		force: true,
	});
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
		guild: filteredServerDataDiscord,
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
		try {
			const member = await guild.members.fetch({ user: userId, force: true }); //userId can be string
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
		} catch (error) {
			if (!(error instanceof DiscordAPIError)) {
				console.error(`Error fetching guild ${guild.id}:`, error);
			}
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
	const guild = await discordClient.guilds.fetch({
		guild: serverId,
	});
	const roles = await getRoleInServerInDbByRoleIds({ serverId, roleIds });
	for (const role of roles) {
		const roleObj = await guild.roles.fetch(role.roleId, { force: true });
		if (roleObj && roleObj.name !== "@everyone") {
			await guild.members
				.fetch({ user: userId, force: true })
				.then((member) => {
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
	const guild = await discordClient.guilds.fetch({
		guild: serverId,
	});
	const roles = await getRoleInServerInDbByRoleIds({ serverId, roleIds });
	for (const role of roles) {
		const roleObj = await guild.roles.fetch(role.roleId, { force: true });
		if (roleObj && roleObj.name !== "@everyone") {
			await guild.members
				.fetch({ user: userId, force: true })
				.then((member) => {
					member.roles.remove(roleObj);
				});
		}
	}
};

export const syncRolesWithDbAndDiscord = async (
	serverId: string,
): Promise<SyncRolesResponse> => {
	const guild = await discordClient.guilds.fetch({
		guild: serverId,
	});
	const roles = await guild.roles.fetch();
	console.log("Roles fetched from Discord:", roles);
	const dbRoles = await getAllRolesInServerInDb({ serverId });
	const diff = { roles_created: [], roles_deleted: [] } as SyncRolesResponse;
	//prioritize discord side
	roles.forEach(async (role) => {
		if (!dbRoles.find((dbRole) => dbRole.roleId === role.id)) {
			await createRoleInDb({ serverId, roleId: role.id });
			diff.roles_created.push(role.id as string);
		}
	});
	dbRoles.forEach(async (dbRole) => {
		if (!roles.find((role) => role.id === dbRole.roleId)) {
			await deleteRoleFromDb({ serverId, roleId: dbRole.roleId });
			diff.roles_deleted.push(dbRole.roleId as string);
		}
	});
	return diff;
};

export const getAllRolesInServerInDiscordApi = async (
	serverId: string,
): Promise<Collection<Snowflake, Role>> => {
	const guild = await discordClient.guilds.fetch({
		guild: serverId,
	});
	const roles = await guild.roles.fetch();
	return roles;
};

// MUST authenticate before using
export const getMyDataInServerInDiscordApi = async (
	serverId: string,
	userId: string,
): Promise<GuildMember> => {
	const guild = await discordClient.guilds.fetch({
		guild: serverId,
	});
	const member = await guild.members.fetch(userId);
	return member;
};
