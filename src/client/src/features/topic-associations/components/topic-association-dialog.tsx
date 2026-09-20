import {
	TopicAssociationDialogPresenter,
	type TopicAssociationDialogProps,
} from "./topic-association-dialog.presenter";
import { TopicAssociationDialogView } from "./topic-association-dialog.view";

export type {
	TopicAssociationDialogProps,
	TopicAssociationOption,
} from "./topic-association-dialog.presenter";

export function TopicAssociationDialog(props: TopicAssociationDialogProps) {
	return (
		<TopicAssociationDialogPresenter {...props}>
			{(model) => <TopicAssociationDialogView {...model} />}
		</TopicAssociationDialogPresenter>
	);
}
export default TopicAssociationDialog;
