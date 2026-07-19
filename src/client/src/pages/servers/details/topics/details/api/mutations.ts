import { getErrorMessage } from "../../../api/get-error-message";

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
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/roles/${roleId}/${action}`,
		{ method: "POST", credentials: "include" },
	);
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "역할을 변경하지 못했습니다."),
		);
	}
	return response.json();
}
