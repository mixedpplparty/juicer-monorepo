import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { getRoleInServerInDbByRoleIds } from "../../../functions/db.ts";
import {
	assignRolesToUser,
	authenticateAndAuthorizeUser,
	unassignRolesFromUser,
} from "../../../functions/discord-bot.ts";

const app = new Hono();

// Admin required
//get all roles within guild(server)
app.get("/", async (c) => {
	const serverId = c.req.param("serverId");
	const accessToken = getCookie(c, "discord_access_token");
	const { guild, member } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
		true,
	);
	return c.json({ serverRoles: guild.roles, myRoles: member.roles });
});

app.get("/:roleId/assign", async (c) => {
	const serverId = c.req.param("serverId");
	const roleId = c.req.param("roleId");
	const accessToken = getCookie(c, "discord_access_token");
	const { member } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
	);
	const roleInfoInDb = await getRoleInServerInDbByRoleIds({
		roleIds: [roleId],
		serverId: serverId as string,
	});
	if (roleInfoInDb.length === 0) {
		return c.json(
			{
				message:
					"Role not found in DB. If role exists in server, it needs to be synced.",
			},
			404,
		);
	}
	if (!roleInfoInDb[0].selfAssignable) {
		return c.json(
			{ message: "Role is marked as not self-assignable in DB." },
			400,
		);
	}
	await assignRolesToUser(serverId as string, member.id, [roleId]);
	return c.json({ message: "Role assigned successfully." }, 200);
});

app.get("/:roleId/unassign", async (c) => {
	const serverId = c.req.param("serverId");
	const roleId = c.req.param("roleId");
	const accessToken = getCookie(c, "discord_access_token");
	const { member } = await authenticateAndAuthorizeUser(
		serverId as string,
		accessToken as string,
	);
	const roleInfoInDb = await getRoleInServerInDbByRoleIds({
		roleIds: [roleId],
		serverId: serverId as string,
	});
	if (roleInfoInDb.length === 0) {
		return c.json(
			{
				message:
					"Role not found in DB. If role exists in server, it needs to be synced.",
			},
			404,
		);
	}
	if (!roleInfoInDb[0].selfAssignable) {
		return c.json(
			{ message: "Role is marked as not self-assignable in DB." },
			400,
		);
	}
	await unassignRolesFromUser(serverId as string, member.id, [roleId]);
	return c.json({ message: "Role unassigned successfully." }, 200);
});

export default app;
