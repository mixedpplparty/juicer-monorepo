import { HttpError } from "@/shared/api/fetch-json";

const backendBase = import.meta.env.VITE_BACKEND_URI;

/**
 * Revokes the current Discord access and refresh tokens and clears their cookies.
 * Navigation and client-cache cleanup are intentionally left to the UI caller.
 */
export async function logout(): Promise<void> {
	const response = await fetch(`${backendBase}/discord/auth/revoke`, {
		method: "POST",
		credentials: "include",
	});

	if (!response.ok) {
		throw new HttpError(response, "로그아웃하지 못했습니다.");
	}
}
