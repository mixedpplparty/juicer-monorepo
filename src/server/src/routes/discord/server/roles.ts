import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import {
	SetRoleSelfAssignableRequestBody,
	UpdateRoleSettingsRequestBody,
} from "juicer-shared/dist/types/index.js";
import {
	getRoleInServerInDbByRoleIds,
	updateRoleSettings,
} from "../../../functions/db.js";
import {
	assignRolesToUser,
	authenticateAndAuthorizeUser,
	getGuildAndMemberData,
	unassignRolesFromUser,
} from "../../../functions/discord-bot.js";

const app = new Hono();

// Admin required
//get all roles within guild(server)
app.get("/", async (c) => {
	const serverId = c.req.param("serverId");
	const accessToken = getCookie(c, "discord_access_token");
	const { guild, member } = await getGuildAndMemberData(
		serverId as string,
		accessToken as string,
		true,
	);
	return c.json({ serverRoles: guild.roles, myRoles: member.roles });
});

app.post("/:roleId/assign", async (c) => {
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
		throw new HTTPException(404, {
			message:
				"Role not found in DB. If role exists in server, it needs to be synced.",
		});
	}
	if (!roleInfoInDb[0].selfAssignable) {
		throw new HTTPException(400, {
			message: "Role is marked as not self-assignable in DB.",
		});
	}
	await assignRolesToUser(serverId as string, member.id, [roleId]);
	return c.json({ message: "Role assigned successfully." }, 200);
});

app.post("/:roleId/unassign", async (c) => {
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
		throw new HTTPException(404, {
			message:
				"Role not found in DB. If role exists in server, it needs to be synced.",
		});
	}
	if (!roleInfoInDb[0].selfAssignable) {
		throw new HTTPException(400, {
			message: "Role is marked as not self-assignable in DB.",
		});
	}
	await unassignRolesFromUser(serverId as string, member.id, [roleId]);
	return c.json({ message: "Role unassigned successfully." }, 200);
});

app.patch(
	"/:roleId",
	zValidator("json", UpdateRoleSettingsRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const roleId = c.req.param("roleId");
		const body = c.req.valid("json");
		const accessToken = getCookie(c, "discord_access_token");

		if (!serverId || !roleId) {
			throw new HTTPException(400, {
				message: "Server ID and role ID are required.",
			});
		}

		await authenticateAndAuthorizeUser(serverId, accessToken as string, true);

		const role = await updateRoleSettings({
			serverId,
			roleId,
			...body,
		});
		return c.json(role, 200);
	},
);

// Deprecated compatibility endpoint. Use PATCH /:roleId instead.
app.post(
	"/:roleId/update",
	zValidator("json", SetRoleSelfAssignableRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const roleId = c.req.param("roleId");
		const body = await c.req.valid("json");
		const accessToken = getCookie(c, "discord_access_token");
		await authenticateAndAuthorizeUser(
			serverId as string,
			accessToken as string,
			true,
		);
		const role = await updateRoleSettings({
			roleId: roleId as string,
			serverId: serverId as string,
			selfAssignable: body.selfAssignable ?? false,
			description: body.description,
		});
		return c.json([role], 200);
	},
);

export default app;
