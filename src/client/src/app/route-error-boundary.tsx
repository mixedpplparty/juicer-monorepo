import { isRouteErrorResponse, useRouteError } from "react-router";
import { routeErrorBoundaryStyles } from "./route-error-boundary.styles";

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

export function RouteErrorBoundary() {
	const error = useRouteError();
	const title = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`.trim()
		: "Something went wrong";

	return (
		<main css={routeErrorBoundaryStyles.root}>
			<div css={routeErrorBoundaryStyles.content} role="alert">
				<h1 css={routeErrorBoundaryStyles.title}>{title}</h1>
				<p css={routeErrorBoundaryStyles.message}>{getErrorMessage(error)}</p>
				<button
					css={routeErrorBoundaryStyles.retryButton}
					type="button"
					onClick={() => window.location.reload()}
				>
					Try again
				</button>
			</div>
		</main>
	);
}

export default RouteErrorBoundary;
