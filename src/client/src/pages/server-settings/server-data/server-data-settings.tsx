import {
	ServerDataSettingsPresenter,
	type ServerDataSettingsProps,
} from "./server-data-settings.presenter";
import { ServerDataSettingsView } from "./server-data-settings.view";

export type { ServerDataSettingsProps } from "./server-data-settings.presenter";

export function ServerDataSettings(props: ServerDataSettingsProps) {
	return (
		<ServerDataSettingsPresenter {...props}>
			{(model) => <ServerDataSettingsView {...model} />}
		</ServerDataSettingsPresenter>
	);
}
export default ServerDataSettings;
