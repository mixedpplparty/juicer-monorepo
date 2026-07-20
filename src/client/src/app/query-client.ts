import { HttpError } from "@/shared/api/fetch-json";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

function handleApiError(error: unknown) {
	if (
		error instanceof HttpError &&
		error.status === 401 &&
		window.location.pathname !== "/" &&
		window.location.pathname !== "/sign-in-failed"
	) {
		window.location.replace("/");
	}
}

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: handleApiError,
	}),
	mutationCache: new MutationCache({
		onError: handleApiError,
	}),
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: (failureCount, error) =>
				!(error instanceof HttpError && error.status < 500) && failureCount < 2,
		},
	},
});

export default queryClient;
