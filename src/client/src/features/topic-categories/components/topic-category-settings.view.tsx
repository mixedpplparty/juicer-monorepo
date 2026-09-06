import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { Text } from "@mixedpplparty/juicer-m3/text";
import DeleteTopicCategoryDialog from "./delete-topic-category-dialog";
import TopicCategoryDialog from "./topic-category-dialog";
import type { TopicCategorySettingsViewModel } from "./topic-category-settings.presenter";
import { topicCategorySettingsStyles } from "./topic-category-settings.styles";
export function TopicCategorySettingsView({
	categories,
	creating,
	setCreating,
	pendingDelete,
	setPendingDelete,
	submitCategoryPending,
	submitCategory,
	removeCategoryPending,
	removeCategory,
}: TopicCategorySettingsViewModel) {
	return (
		<>
			<List
				container="transparent"
				aria-label="주제 카테고리 설정"
				css={topicCategorySettingsStyles.list}
			>
				{categories.map((category) => (
					<ListItem
						key={category.categoryId}
						css={topicCategorySettingsStyles.item}
						headline={category.name}
						trailing={
							<IconButton
								type="button"
								aria-label={`${category.name} 주제 카테고리 삭제`}
								disabled={removeCategoryPending}
								onClick={() => setPendingDelete(category)}
							>
								<DeleteIcon />
							</IconButton>
						}
					/>
				))}
				{categories.length === 0 ? (
					<ListItem
						css={topicCategorySettingsStyles.item}
						headline={
							<Text typeRole="body" size="medium">
								등록된 주제 카테고리가 없습니다.
							</Text>
						}
					/>
				) : null}
				<ListItem
					render={
						<button
							type="button"
							disabled={submitCategoryPending}
							onClick={() => setCreating(true)}
						/>
					}
					css={[
						topicCategorySettingsStyles.item,
						topicCategorySettingsStyles.action,
					]}
					leading={<AddIcon css={topicCategorySettingsStyles.addIcon} />}
					headline="주제 카테고리 추가하기"
				/>
			</List>

			<TopicCategoryDialog
				key={creating ? "open" : "closed"}
				open={creating}
				pending={submitCategoryPending}
				onOpenChange={setCreating}
				onSubmit={(body) => void submitCategory(body)}
			/>

			<DeleteTopicCategoryDialog
				category={pendingDelete}
				pending={removeCategoryPending}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				onConfirm={() => {
					if (pendingDelete) {
						void removeCategory(pendingDelete.categoryId);
					}
				}}
			/>
		</>
	);
}
