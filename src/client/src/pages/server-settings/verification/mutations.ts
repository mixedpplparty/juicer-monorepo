import type { ServerDataDb } from "juicer-shared";
import { fetchJson } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

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
