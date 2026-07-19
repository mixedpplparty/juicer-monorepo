const backendBase = import.meta.env.VITE_BACKEND_URI;

export async function isAuthenticated(request: Request): Promise<boolean> {
	const response = await fetch(`${backendBase}/discord/auth/me`, {
		credentials: "include",
		cache: "no-store",
		signal: request.signal,
	});

	if (response.status === 401) {
		return false;
	}

	if (!response.ok) {
		throw response;
	}

	return true;
}
