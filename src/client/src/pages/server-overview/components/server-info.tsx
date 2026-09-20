import {
	ServerInfoPresenter,
	type ServerInfoProps,
} from "./server-info.presenter";
import { ServerInfoView } from "./server-info.view";

export type { ServerInfoProps } from "./server-info.presenter";

export function ServerInfo(props: ServerInfoProps) {
	return (
		<ServerInfoPresenter {...props}>
			{(model) => <ServerInfoView {...model} />}
		</ServerInfoPresenter>
	);
}
export default ServerInfo;
