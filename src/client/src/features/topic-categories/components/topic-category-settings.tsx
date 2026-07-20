import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category } from "juicer-shared";
import { useState } from "react";
import { invalidateServerTopicState } from "@/shared/api/query-invalidation";
import { serverQueryKeys } from "@/shared/api/query-keys/server-query-keys";
import { showRequestError } from "@/shared/notifications/show-request-error";
import { createTopicCategory, deleteTopicCategory } from "../api/mutations";
import DeleteTopicCategoryDialog from "./delete-topic-category-dialog";
import TopicCategoryDialog from "./topic-category-dialog";
import { topicCategorySettingsStyles } from "./topic-category-settings.styles";

interface TopicCategorySettingsProps {
	serverId: string;
	categories: Category[];
}

export function TopicCategorySettings({
	serverId,
	categories,
}: TopicCategorySettingsProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const [creating, setCreating] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
	const refreshServer = () =>
		queryClient.refetchQueries({
			queryKey: serverQueryKeys.data(serverId),
		});

	const createMutation = useMutation({
		mutationFn: (name: string) => createTopicCategory({ serverId, name }),
		onSuccess: async () => {
			await refreshServer();
			setCreating(false);
			enqueue("주제 카테고리를 추가했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});
	const deleteMutation = useMutation({
		mutationFn: (categoryId: number) =>
			deleteTopicCategory({ serverId, categoryId }),
		onSuccess: async () => {
			await invalidateServerTopicState(queryClient, serverId);
			setPendingDelete(null);
			enqueue("주제 카테고리를 삭제했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});

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
								disabled={deleteMutation.isPending}
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
							disabled={createMutation.isPending}
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
				open={creating}
				pending={createMutation.isPending}
				onOpenChange={setCreating}
				onSubmit={(name) => createMutation.mutate(name)}
			/>

			<DeleteTopicCategoryDialog
				category={pendingDelete}
				pending={deleteMutation.isPending}
				onOpenChange={(open) => !open && setPendingDelete(null)}
				onConfirm={() => {
					if (pendingDelete) {
						deleteMutation.mutate(pendingDelete.categoryId);
					}
				}}
			/>
		</>
	);
}

export default TopicCategorySettings;
