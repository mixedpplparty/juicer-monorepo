import {
	RoleSettingsPresenter,
	type RoleSettingsProps,
} from "./role-settings.presenter";
import { RoleSettingsView } from "./role-settings.view";

export type { RoleSettingsProps } from "./role-settings.presenter";

export function RoleSettings(props: RoleSettingsProps) {
	return (
		<RoleSettingsPresenter {...props}>
			{(model) => <RoleSettingsView {...model} />}
		</RoleSettingsPresenter>
	);
}
export default RoleSettings;
