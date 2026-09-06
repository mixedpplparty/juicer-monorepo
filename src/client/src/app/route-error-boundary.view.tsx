import type { RouteErrorViewModel } from "./route-error-boundary.presenter";
import { routeErrorBoundaryStyles } from "./route-error-boundary.styles";
export function RouteErrorBoundaryView({
	title,
	message,
	retry,
}: RouteErrorViewModel) {
	return (
		<main css={routeErrorBoundaryStyles.root}>
			<div css={routeErrorBoundaryStyles.content} role="alert">
				<h1 css={routeErrorBoundaryStyles.title}>{title}</h1>
				<p css={routeErrorBoundaryStyles.message}>{message}</p>
				<button
					css={routeErrorBoundaryStyles.retryButton}
					type="button"
					onClick={retry}
				>
					Try again
				</button>
			</div>
		</main>
	);
}
