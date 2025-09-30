import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { SetRoleSelfAssignableRequestBody } from "juicer-shared/dist/types/index.js";
import {
	getRoleInServerInDbByRoleIds,
	setRoleSelfAssignable,
} from "../../../functions/db.js";
import {
	assignRolesToUser,
	authenticateAndAuthorizeUser,
	unassignRolesFromUser,
} from "../../../functions/discord-bot.js";

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

app.post(
	"/:roleId/update",
	zValidator("json", SetRoleSelfAssignableRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const roleId = c.req.param("roleId");
		const body = await c.req.valid("json");
		const accessToken = getCookie(c, "discord_access_token");
		const { manageGuildPermission } = await authenticateAndAuthorizeUser(
			serverId as string,
			accessToken as string,
			true,
		);
		if (manageGuildPermission) {
			const role = await setRoleSelfAssignable({
				roleId: roleId as string,
				serverId: serverId as string,
				selfAssignable: body.selfAssignable as boolean | null,
			});
			return c.json(role, 200);
		}
		throw new HTTPException(403, {
			message: "User does not have manage server permission.",
		});
	},
);

export default app;
