import type {
	CreateGameResponse,
	Role,
	RoleCategory,
	ServerDataDb,
	SyncRolesResponse,
	UpdateGameResponse,
} from "juicer-shared";

const backendBase = import.meta.env.VITE_BACKEND_URI;

async function getErrorMessage(response: Response, fallback: string) {
	const errorBody: unknown = await response.json().catch(() => null);
	return typeof errorBody === "object" &&
		errorBody !== null &&
		"message" in errorBody &&
		typeof errorBody.message === "string"
		? errorBody.message
		: fallback;
}

export interface CreateTopicInput {
	serverId: string;
	name: string;
	description: string | null;
	categoryId: number | null;
}

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

export async function createTopic({
	serverId,
	name,
	description,
	categoryId,
}: CreateTopicInput): Promise<CreateGameResponse[]> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/games/create`,
		{
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name,
				description,
				categoryId,
			}),
		},
	);

	if (!response.ok) {
		const errorBody: unknown = await response.json().catch(() => null);
		const message =
			typeof errorBody === "object" &&
			errorBody !== null &&
			"message" in errorBody &&
			typeof errorBody.message === "string"
				? errorBody.message
				: "주제를 추가하지 못했습니다.";

		throw new Error(message);
	}

	return response.json();
}

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
		{
			method: "POST",
			credentials: "include",
		},
	);

	if (!response.ok) {
		const errorBody: unknown = await response.json().catch(() => null);
		const message =
			typeof errorBody === "object" &&
			errorBody !== null &&
			"message" in errorBody &&
			typeof errorBody.message === "string"
				? errorBody.message
				: "역할을 변경하지 못했습니다.";

		throw new Error(message);
	}

	return response.json();
}

export interface UpdateTopicInput {
	serverId: string;
	topicId: number;
	name: string;
	description: string | null;
	channelIds: string[];
	roleIds: string[];
}

export async function updateTopic({
	serverId,
	topicId,
	name,
	description,
	channelIds,
	roleIds,
}: UpdateTopicInput): Promise<UpdateGameResponse> {
	const response = await fetch(
		`${backendBase}/discord/servers/${serverId}/games/${topicId}`,
		{
			method: "PUT",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name,
				description,
				channels: channelIds,
				roleIds,
			}),
		},
	);

	if (!response.ok) {
		const errorBody: unknown = await response.json().catch(() => null);
		const message =
			typeof errorBody === "object" &&
			errorBody !== null &&
			"message" in errorBody &&
			typeof errorBody.message === "string"
				? errorBody.message
				: "주제를 저장하지 못했습니다.";

		throw new Error(message);
	}

	return response.json();
}
