import {
	RoleCategoryDialogPresenter,
	type RoleCategoryDialogProps,
} from "./role-category-dialog.presenter";
import { RoleCategoryDialogView } from "./role-category-dialog.view";

export type { RoleCategoryDialogProps } from "./role-category-dialog.presenter";

export function RoleCategoryDialog(props: RoleCategoryDialogProps) {
	return (
		<RoleCategoryDialogPresenter {...props}>
			{(model) => <RoleCategoryDialogView {...model} />}
		</RoleCategoryDialogPresenter>
	);
}
export default RoleCategoryDialog;
