import { ServerDetailsPagePresenter } from "./server-details-page.presenter";
import { ServerDetailsPageView } from "./server-details-page.view";

export type { ServerDetailsPageProps } from "./server-details-page.presenter";

export function ServerDetailsPage() {
	return (
		<ServerDetailsPagePresenter>
			{(model) => <ServerDetailsPageView {...model} />}
		</ServerDetailsPagePresenter>
	);
}
export default ServerDetailsPage;
