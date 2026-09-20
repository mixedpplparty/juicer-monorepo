import { RouteErrorBoundaryPresenter } from "./route-error-boundary.presenter";
import { RouteErrorBoundaryView } from "./route-error-boundary.view";
export function RouteErrorBoundary() {
	return (
		<RouteErrorBoundaryPresenter>
			{(model) => <RouteErrorBoundaryView {...model} />}
		</RouteErrorBoundaryPresenter>
	);
}
export default RouteErrorBoundary;
