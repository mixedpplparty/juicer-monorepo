import {
	TopicEditContentPresenter,
	type TopicEditContentProps,
} from "./topic-edit-content.presenter";
import { TopicEditContentView } from "./topic-edit-content.view";

export type { TopicEditContentProps } from "./topic-edit-content.presenter";

export function TopicEditContent(props: TopicEditContentProps) {
	return (
		<TopicEditContentPresenter {...props}>
			{(model) => <TopicEditContentView {...model} />}
		</TopicEditContentPresenter>
	);
}
export default TopicEditContent;
