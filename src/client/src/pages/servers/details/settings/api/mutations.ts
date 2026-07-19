import type {
	Role,
	RoleCategory,
	ServerDataDb,
	SyncRolesResponse,
} from "juicer-shared";
import { getErrorMessage } from "../../api/get-error-message";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export async function updateServerVerificationRequired({
	serverId,
	verificationRequired,
}: {
	serverId: string;
	verificationRequired: boolean;
}): Promise<ServerDataDb[]> {
	const response = await fetch(`${backendBase}/discord/servers/${serverId}`, {
		method: "PUT",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ verificationRequired }),
	});
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "서버 보안 설정을 변경하지 못했습니다."),
		);
	}
	return response.json();
}

export async function syncServerRoles(
	serverId: string,
): Promise<SyncRolesResponse> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/sync-roles`,
		{ credentials: "include" },
	);
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "서버 데이터를 동기화하지 못했습니다."),
		);
	}
	return response.json();
}

export async function createRoleCategory({
	serverId,
	name,
}: {
	serverId: string;
	name: string;
}): Promise<RoleCategory[]> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/role-categories/create`,
		{
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name }),
		},
	);
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "역할 분류를 추가하지 못했습니다."),
		);
	}
	return response.json();
}

export async function deleteRoleCategory({
	serverId,
	roleCategoryId,
}: {
	serverId: string;
	roleCategoryId: number;
}): Promise<RoleCategory[]> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/role-categories/${roleCategoryId}`,
		{ method: "DELETE", credentials: "include" },
	);
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "역할 분류를 삭제하지 못했습니다."),
		);
	}
	return response.json();
}

export async function assignRoleCategory({
	serverId,
	roleId,
	roleCategoryId,
}: {
	serverId: string;
	roleId: string;
	roleCategoryId: number | null;
}): Promise<Role[]> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/role-categories/assign`,
		{
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ roleId, roleCategoryId }),
		},
	);
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "역할 분류를 변경하지 못했습니다."),
		);
	}
	return response.json();
}

export async function updateRoleSettings({
	serverId,
	roleId,
	selfAssignable,
	description,
}: {
	serverId: string;
	roleId: string;
	selfAssignable: boolean;
	description: string | null;
}): Promise<Role[]> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/roles/${roleId}/update`,
		{
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ selfAssignable, description }),
		},
	);
	if (!response.ok) {
		throw new Error(
			await getErrorMessage(response, "역할 설정을 변경하지 못했습니다."),
		);
	}
	return response.json();
}
