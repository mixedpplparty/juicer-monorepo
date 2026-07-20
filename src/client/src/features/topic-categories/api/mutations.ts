import type { Category } from "juicer-shared";
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
