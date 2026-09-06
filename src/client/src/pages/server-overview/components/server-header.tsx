import {
	ServerHeaderPresenter,
	type ServerHeaderProps,
} from "./server-header.presenter";
import { ServerHeaderView } from "./server-header.view";

export type { ServerHeaderProps } from "./server-header.presenter";
export function ServerHeader(props: ServerHeaderProps) {
	return (
		<ServerHeaderPresenter {...props}>
			{(model) => <ServerHeaderView {...model} />}
		</ServerHeaderPresenter>
	);
}
export default ServerHeader;
