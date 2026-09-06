import {
	DeleteRoleCategoryDialogPresenter,
	type DeleteRoleCategoryDialogProps,
} from "./delete-role-category-dialog.presenter";
import { DeleteRoleCategoryDialogView } from "./delete-role-category-dialog.view";

export type { DeleteRoleCategoryDialogProps } from "./delete-role-category-dialog.presenter";
export function DeleteRoleCategoryDialog(props: DeleteRoleCategoryDialogProps) {
	return (
		<DeleteRoleCategoryDialogPresenter {...props}>
			{(model) => <DeleteRoleCategoryDialogView {...model} />}
		</DeleteRoleCategoryDialogPresenter>
	);
}
export default DeleteRoleCategoryDialog;
