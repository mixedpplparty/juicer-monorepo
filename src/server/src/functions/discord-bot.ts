import type {
	Collection,
	Client as DiscordClient,
	GuildMember,
	Role,
	Snowflake,
} from "discord.js";
import {
	ChannelType,
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
	ServerDataDiscordChannel,
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

// Resolve a guild from the gateway cache when possible (the bot has the Guilds
// intent, so guilds it is in are already cached) and only fall back to a REST
// fetch on a miss. Avoids a Discord round-trip on hot read paths like the
// per-game thumbnail endpoint, which the client fires once per game.
const resolveGuild = (serverId: string) =>
	discordClient.guilds.cache.get(serverId) ??
	discordClient.guilds.fetch({ guild: serverId });

export const authenticateAndAuthorizeUser = async (
	serverId: string,
	accessToken: string,
	requireManageGuildPermissions: boolean = false,
	forceMemberFetch: boolean = true,
): Promise<{
	member: GuildMember;
	manageGuildPermission: boolean;
}> => {
	// Fix for #15: Only do the authentication part for optimization.
	// The OAuth user lookup and the guild resolution are independent — run them
	// concurrently instead of one after the other.
	const [userData, guild] = await Promise.all([
		getDiscordOAuthUserData(accessToken),
		resolveGuild(serverId),
	]);
	if (!guild) {
		throw new HTTPException(404, {
			message: "Server not found. Bot may not be in that server.",
		});
	}
	// force defaults to true (callers that need fresh roles/permissions); read-only
	// endpoints pass false so repeated hits reuse the member cache instead of
	// forcing a Discord round-trip (and tripping rate limits) on every request.
	const member: GuildMember = await guild.members.fetch({
		user: userData.id,
		force: forceMemberFetch,
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
		manageGuildPermission: member.permissions.has(
			PermissionFlagsBits.ManageGuild,
		),
	};
};

export const getGuildAndMemberData = async (
	serverId: string,
	accessToken: string,
	requireManageGuildPermissions: boolean = false,
): Promise<{
	guild: FilteredServerDataDiscord;
	member: GuildMember;
	manageGuildPermission: boolean;
}> => {
	// Resolve the OAuth user and the guild in parallel — neither depends on the
	// other. Previously every Discord call below ran sequentially (~6 round-trips
	// back to back), which was the main source of server-data latency.
	const [userData, guild] = await Promise.all([
		getDiscordOAuthUserData(accessToken),
		resolveGuild(serverId),
	]);
	if (!guild) {
		throw new HTTPException(404, {
			message: "Server not found. Bot may not be in that server.",
		});
	}
	// Owner, channels, roles and the requesting member are independent given the
	// guild — fetch them concurrently instead of one after another.
	const [owner, fetchedChannels, fetchedRoles, member] = await Promise.all([
		guild.fetchOwner(),
		guild.channels.fetch(),
		guild.roles.fetch(),
		guild.members.fetch({ user: userData.id, force: true }),
	]);
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

	const channels: ServerDataDiscordChannel[] = [];
	fetchedChannels.forEach((channel) => {
		if (channel && channel.viewable && channel.type === ChannelType.GuildText) {
			channels.push({ id: channel.id, name: channel.name });
		}
	});

	const filteredServerDataDiscord = {
		id: guild.id,
		name: guild.name,
		icon: guild.iconURL() ?? null,
		ownerId: guild.ownerId,
		ownerName: owner.displayName,
		ownerNick: owner.nickname ?? null,
		memberCount: guild.memberCount,
		// meInRole now reads from the fetched member's own roles. It previously used
		// role.members.has(userData.id), which ran before the member was fetched and
		// was wrong on a cold cache (issue #23: role state only correct after a
		// second request).
		roles: fetchedRoles.map((role) => ({
			id: role.id,
			name: role.name,
			color: role.hexColor,
			icon: role.iconURL() ?? null,
			managed: role.managed,
			meInRole: member.roles.cache.has(role.id),
		})),
		channels,
	};

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
	// The bot has the Guilds intent, so every guild it is in is already cached —
	// use the cache instead of REST-fetching each one, and check membership for
	// all guilds concurrently instead of in a sequential loop (this powers the
	// dashboard server list, which was the slowest read on a multi-guild bot).
	const guilds = [...discordClient.guilds.cache.values()];
	const results = await Promise.all(
		guilds.map(async (guild): Promise<FilteredGuild | null> => {
			let member: GuildMember;
			try {
				member = await guild.members.fetch({ user: userId });
			} catch (error) {
				// 10007 = user simply isn't in this guild; anything else is real.
				if (!(error instanceof DiscordAPIError)) {
					console.error(`Error fetching member in guild ${guild.id}:`, error);
				}
				return null;
			}
			if (!member) return null;
			const owner = await guild.fetchOwner();
			return {
				id: guild.id,
				name: guild.name,
				icon: guild.iconURL() ?? null,
				ownerId: guild.ownerId,
				ownerName: owner.displayName,
				ownerNick: owner.nickname ?? undefined,
				memberCount: guild.memberCount,
			};
		}),
	);
	return results.filter((g): g is FilteredGuild => g !== null);
};

// MUST authenticate before using
// MUST check if role is self-assignable on the DB side
// needs to be tested - can we fetch guild only with serverId?
export const assignRolesToUser = async (
	serverId: string,
	userId: string,
	roleIds: string[],
) => {
	// Cache-first guild + a single member fetch (not once per role), then add each
	// role concurrently. Previously this re-fetched the guild, every role and the
	// member with force on each loop iteration.
	const guild = await resolveGuild(serverId);
	const roles = await getRoleInServerInDbByRoleIds({ serverId, roleIds });
	const member = await guild.members.fetch({ user: userId });
	await Promise.all(
		roles.map(async (role) => {
			const roleObj =
				guild.roles.cache.get(role.roleId) ??
				(await guild.roles.fetch(role.roleId));
			if (roleObj && roleObj.name !== "@everyone") {
				await member.roles.add(roleObj);
			}
		}),
	);
};

// MUST authenticate before using
// MUST check if role is self-assignable on the DB side
// needs to be tested - can we fetch guild only with serverId?
export const unassignRolesFromUser = async (
	serverId: string,
	userId: string,
	roleIds: string[],
) => {
	// Same shape as assignRolesToUser: cache-first guild, one member fetch, then
	// remove each role concurrently.
	const guild = await resolveGuild(serverId);
	const roles = await getRoleInServerInDbByRoleIds({ serverId, roleIds });
	const member = await guild.members.fetch({ user: userId });
	await Promise.all(
		roles.map(async (role) => {
			const roleObj =
				guild.roles.cache.get(role.roleId) ??
				(await guild.roles.fetch(role.roleId));
			if (roleObj && roleObj.name !== "@everyone") {
				await member.roles.remove(roleObj);
			}
		}),
	);
};

export const syncRolesWithDbAndDiscord = async (
	serverId: string,
): Promise<SyncRolesResponse> => {
	const guild = await resolveGuild(serverId);
	const roles = await guild.roles.fetch();
	const dbRoles = await getAllRolesInServerInDb({ serverId });
	const dbRoleIds = new Set(dbRoles.map((dbRole) => dbRole.roleId));
	const discordRoleIds = new Set(roles.map((role) => role.id));

	// Prioritize the Discord side: create roles new to the DB, delete roles that
	// no longer exist in Discord.
	const toCreate = [...roles.values()].filter(
		(role) => !dbRoleIds.has(role.id),
	);
	const toDelete = dbRoles.filter(
		(dbRole) => !discordRoleIds.has(dbRole.roleId),
	);

	// Await all writes (the previous forEach(async) returned the diff BEFORE the
	// inserts/deletes finished, so the response was empty and the writes raced)
	// and run them concurrently.
	await Promise.all([
		...toCreate.map((role) => createRoleInDb({ serverId, roleId: role.id })),
		...toDelete.map((dbRole) =>
			deleteRoleFromDb({ serverId, roleId: dbRole.roleId }),
		),
	]);

	return {
		roles_created: toCreate.map((role) => role.id),
		roles_deleted: toDelete.map((dbRole) => dbRole.roleId),
	};
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
