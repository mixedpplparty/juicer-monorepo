import {
	RoleSettingsDialogPresenter,
	type RoleSettingsDialogProps,
} from "./role-settings-dialog.presenter";
import { RoleSettingsDialogView } from "./role-settings-dialog.view";

export type { RoleSettingsDialogProps } from "./role-settings-dialog.presenter";

export function RoleSettingsDialog(props: RoleSettingsDialogProps) {
	return (
		<RoleSettingsDialogPresenter {...props}>
			{(model) => <RoleSettingsDialogView {...model} />}
		</RoleSettingsDialogPresenter>
	);
}
export default RoleSettingsDialog;
