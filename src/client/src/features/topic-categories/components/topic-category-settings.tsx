import {
	TopicCategorySettingsPresenter,
	type TopicCategorySettingsProps,
} from "./topic-category-settings.presenter";
import { TopicCategorySettingsView } from "./topic-category-settings.view";

export type { TopicCategorySettingsProps } from "./topic-category-settings.presenter";

export function TopicCategorySettings(props: TopicCategorySettingsProps) {
	return (
		<TopicCategorySettingsPresenter {...props}>
			{(model) => <TopicCategorySettingsView {...model} />}
		</TopicCategorySettingsPresenter>
	);
}
export default TopicCategorySettings;
