import {
	TopicRoleItemPresenter,
	type TopicRoleItemProps,
} from "./topic-role-item.presenter";
import { TopicRoleItemView } from "./topic-role-item.view";

export type { TopicRoleItemProps } from "./topic-role-item.presenter";

export function TopicRoleItem(props: TopicRoleItemProps) {
	return (
		<TopicRoleItemPresenter {...props}>
			{(model) => <TopicRoleItemView {...model} />}
		</TopicRoleItemPresenter>
	);
}
export default TopicRoleItem;
