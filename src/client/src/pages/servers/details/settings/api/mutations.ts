import type {
	Category,
	Role,
	RoleCategory,
	ServerDataDb,
	UpdateRoleSettingsRequest,
} from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

export async function createTopicCategory({
	serverId,
	name,
}: {
	serverId: string;
	name: string;
}): Promise<Category[]> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/categories/create`,
		{
			method: "POST",
			json: { name },
		},
		"주제 카테고리를 추가하지 못했습니다.",
	);
}

export async function deleteTopicCategory({
	serverId,
	categoryId,
}: {
	serverId: string;
	categoryId: number;
}): Promise<Category[]> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/categories/${categoryId}`,
		{ method: "DELETE" },
		"주제 카테고리를 삭제하지 못했습니다.",
	);
}

export async function updateServerVerificationRequired({
	serverId,
	verificationRequired,
}: {
	serverId: string;
	verificationRequired: boolean;
}): Promise<ServerDataDb[]> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}`,
		{
			method: "PUT",
			json: { verificationRequired },
		},
		"서버 보안 설정을 변경하지 못했습니다.",
	);
}

export async function createRoleCategory({
	serverId,
	name,
}: {
	serverId: string;
	name: string;
}): Promise<RoleCategory[]> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/role-categories/create`,
		{
			method: "POST",
			json: { name },
		},
		"역할 분류를 추가하지 못했습니다.",
	);
}

export async function deleteRoleCategory({
	serverId,
	roleCategoryId,
}: {
	serverId: string;
	roleCategoryId: number;
}): Promise<RoleCategory[]> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/role-categories/${roleCategoryId}`,
		{ method: "DELETE" },
		"역할 분류를 삭제하지 못했습니다.",
	);
}

export async function updateRoleSettings({
	serverId,
	roleId,
	...settings
}: {
	serverId: string;
	roleId: string;
} & UpdateRoleSettingsRequest): Promise<Role> {
	return fetchJson(
		`${backendBase}/discord/servers/${serverId}/roles/${roleId}`,
		{
			method: "PATCH",
			json: settings,
		},
		"역할 설정을 변경하지 못했습니다.",
	);
}
