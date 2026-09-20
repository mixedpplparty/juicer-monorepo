import {
	ServerListNavigationPresenter,
	type ServerListNavigationProps,
} from "./server-list-navigation.presenter";
import { ServerListNavigationView } from "./server-list-navigation.view";

export type { ServerListNavigationProps } from "./server-list-navigation.presenter";
export function ServerListNavigation(props: ServerListNavigationProps) {
	return (
		<ServerListNavigationPresenter {...props}>
			{(model) => <ServerListNavigationView {...model} />}
		</ServerListNavigationPresenter>
	);
}
export default ServerListNavigation;
