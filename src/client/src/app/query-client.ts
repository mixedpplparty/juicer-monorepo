import { HttpError } from "@/shared/api/fetch-json";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

function handleApiError(error: unknown) {
	if (!(error instanceof HttpError) || error.status !== 401) {
		return;
	}

	// A 401 means every query populated under the previous session is now
	// untrusted. Evict it before redirecting so the guest-only loader cannot read
	// a still-fresh `myInfo` value and send the user back to a protected route.
	queryClient.removeQueries();

	if (
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
			retry: (failureCount, error) =>
				!(error instanceof HttpError && error.status < 500) && failureCount < 2,
		},
	},
});

export default queryClient;
