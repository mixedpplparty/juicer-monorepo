import {
	TopicAddDialogPresenter,
	type TopicAddDialogProps,
} from "./topic-add-dialog.presenter";
import { TopicAddDialogView } from "./topic-add-dialog.view";

export type { TopicAddDialogProps } from "./topic-add-dialog.presenter";

export function TopicAddDialog(props: TopicAddDialogProps) {
	return (
		<TopicAddDialogPresenter {...props}>
			{(model) => <TopicAddDialogView {...model} />}
		</TopicAddDialogPresenter>
	);
}
export default TopicAddDialog;
