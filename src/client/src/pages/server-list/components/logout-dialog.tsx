import { LogoutDialogPresenter } from "./logout-dialog.presenter";
import { LogoutDialogView } from "./logout-dialog.view";

export type { LogoutDialogProps } from "./logout-dialog.presenter";

export function LogoutDialog() {
	return (
		<LogoutDialogPresenter>
			{(model) => <LogoutDialogView {...model} />}
		</LogoutDialogPresenter>
	);
}
export default LogoutDialog;
