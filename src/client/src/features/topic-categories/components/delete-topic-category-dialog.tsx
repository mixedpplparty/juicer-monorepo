import {
	DeleteTopicCategoryDialogPresenter,
	type DeleteTopicCategoryDialogProps,
} from "./delete-topic-category-dialog.presenter";
import { DeleteTopicCategoryDialogView } from "./delete-topic-category-dialog.view";

export type { DeleteTopicCategoryDialogProps } from "./delete-topic-category-dialog.presenter";
export function DeleteTopicCategoryDialog(
	props: DeleteTopicCategoryDialogProps,
) {
	return (
		<DeleteTopicCategoryDialogPresenter {...props}>
			{(model) => <DeleteTopicCategoryDialogView {...model} />}
		</DeleteTopicCategoryDialogPresenter>
	);
}
export default DeleteTopicCategoryDialog;
