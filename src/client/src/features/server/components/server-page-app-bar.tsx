import {
	ServerPageAppBarPresenter,
	type ServerPageAppBarProps,
} from "./server-page-app-bar.presenter";
import { ServerPageAppBarView } from "./server-page-app-bar.view";

export type { ServerPageAppBarProps } from "./server-page-app-bar.presenter";
export function ServerPageAppBar(props: ServerPageAppBarProps) {
	return (
		<ServerPageAppBarPresenter {...props}>
			{(model) => <ServerPageAppBarView {...model} />}
		</ServerPageAppBarPresenter>
	);
}
export default ServerPageAppBar;
