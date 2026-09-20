import type { ReactNode } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";

function getErrorMessage(error: unknown) {
	if (isRouteErrorResponse(error)) {
		if (
			typeof error.data === "object" &&
			error.data !== null &&
			"message" in error.data &&
			typeof error.data.message === "string"
		) {
			return error.data.message;
		}

		if (typeof error.data === "string") {
			return error.data;
		}

		return error.statusText || `Request failed with status ${error.status}.`;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "An unexpected error occurred.";
}

export interface RouteErrorViewModel {
	title: string;
	message: string;
	retry: () => void;
}
export function RouteErrorBoundaryPresenter({
	children,
}: {
	children: (model: RouteErrorViewModel) => ReactNode;
}) {
	const error = useRouteError();
	return children({
		title: isRouteErrorResponse(error)
			? `${error.status} ${error.statusText}`.trim()
			: "Something went wrong",
		message: getErrorMessage(error),
		retry: () => window.location.reload(),
	});
}
