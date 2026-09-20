import {
	TopicDeleteDialogPresenter,
	type TopicDeleteDialogProps,
} from "./topic-delete-dialog.presenter";
import { TopicDeleteDialogView } from "./topic-delete-dialog.view";

export type { TopicDeleteDialogProps } from "./topic-delete-dialog.presenter";

export function TopicDeleteDialog(props: TopicDeleteDialogProps) {
	return (
		<TopicDeleteDialogPresenter {...props}>
			{(model) => <TopicDeleteDialogView {...model} />}
		</TopicDeleteDialogPresenter>
	);
}
export default TopicDeleteDialog;
