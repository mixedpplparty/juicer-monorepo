import { ServersLayoutPresenter } from "./servers-layout.presenter";
import { ServersLayoutView } from "./servers-layout.view";

export type { ServersLayoutProps } from "./servers-layout.presenter";
export function ServersLayout() {
	return (
		<ServersLayoutPresenter>
			{(model) => <ServersLayoutView {...model} />}
		</ServersLayoutPresenter>
	);
}
export default ServersLayout;
