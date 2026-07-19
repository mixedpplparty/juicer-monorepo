import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export interface SetRoleAssignmentInput {
	serverId: string;
	roleId: string;
	assigned: boolean;
}

export async function setRoleAssignment({
	serverId,
	roleId,
	assigned,
}: SetRoleAssignmentInput): Promise<{ message: string }> {
	const action = assigned ? "assign" : "unassign";
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/roles/${roleId}/${action}`,
		{ method: "POST" },
		"역할을 변경하지 못했습니다.",
	);
}
