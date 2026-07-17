const backendUri = import.meta.env.VITE_BACKEND_URI;

export async function _isAuthenticated(request: Request) {
	const response = await fetch(`${backendUri}/discord/auth/me`, {
		credentials: "include",
		cache: "no-store",
		signal: request.signal, // AbortSignal
	});

	if (response.status === 401) {
		return false;
	}

	if (!response.ok) {
		throw response;
	}

	return true;
}

export default _isAuthenticated;
