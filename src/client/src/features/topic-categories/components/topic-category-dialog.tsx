import {
	TopicCategoryDialogPresenter,
	type TopicCategoryDialogProps,
} from "./topic-category-dialog.presenter";
import { TopicCategoryDialogView } from "./topic-category-dialog.view";

export type { TopicCategoryDialogProps } from "./topic-category-dialog.presenter";

export function TopicCategoryDialog(props: TopicCategoryDialogProps) {
	return (
		<TopicCategoryDialogPresenter {...props}>
			{(model) => <TopicCategoryDialogView {...model} />}
		</TopicCategoryDialogPresenter>
	);
}
export default TopicCategoryDialog;
