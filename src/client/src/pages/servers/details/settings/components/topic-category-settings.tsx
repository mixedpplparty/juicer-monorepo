import { Button, IconButton } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category } from "juicer-shared";
import { useState } from "react";
import { queryKeys } from "@/constants/query-keys";
import { createTopicCategory, deleteTopicCategory } from "../api/mutations";
import { serverSettingsPageStyles } from "./server-settings-content.styles";
import TopicCategoryDialog from "./topic-category-dialog";

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
			queryKey: queryKeys.serverData(serverId),
		});

	const createMutation = useMutation({
		mutationFn: (name: string) => createTopicCategory({ serverId, name }),
		onSuccess: async () => {
			await refreshServer();
			setCreating(false);
			enqueue("주제 카테고리를 추가했습니다.");
		},
		onError: (error) => showError(error, enqueue),
	});
	const deleteMutation = useMutation({
		mutationFn: (categoryId: number) =>
			deleteTopicCategory({ serverId, categoryId }),
		onSuccess: async () => {
			await Promise.all([
				refreshServer(),
				queryClient.invalidateQueries({
					queryKey: queryKeys.topics.byServer(serverId),
				}),
			]);
			setPendingDelete(null);
			enqueue("주제 카테고리를 삭제했습니다.");
		},
		onError: (error) => showError(error, enqueue),
	});

	return (
		<>
			<List
				container="transparent"
				aria-label="주제 카테고리 설정"
				css={serverSettingsPageStyles.list}
			>
				{categories.map((category) => (
					<ListItem
						key={category.categoryId}
						css={serverSettingsPageStyles.item}
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
						css={serverSettingsPageStyles.item}
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
						serverSettingsPageStyles.item,
						serverSettingsPageStyles.actionItem,
					]}
					leading={<AddIcon css={serverSettingsPageStyles.addIcon} />}
					headline="주제 카테고리 추가하기"
				/>
			</List>

			<TopicCategoryDialog
				open={creating}
				pending={createMutation.isPending}
				onOpenChange={setCreating}
				onSubmit={(name) => createMutation.mutate(name)}
			/>

			<Dialog.Root
				open={pendingDelete !== null}
				onOpenChange={(open) =>
					!deleteMutation.isPending && !open && setPendingDelete(null)
				}
			>
				<Dialog.Popup>
					<Dialog.Title>주제 카테고리를 삭제할까요?</Dialog.Title>
					<Dialog.Description>
						‘{pendingDelete?.name}’ 카테고리가 삭제되고, 이 카테고리의 주제는
						미분류 상태로 돌아갑니다.
					</Dialog.Description>
					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={deleteMutation.isPending}
							onClick={() => setPendingDelete(null)}
						>
							취소
						</Button>
						<Button
							type="button"
							disabled={deleteMutation.isPending}
							css={serverSettingsPageStyles.deleteButton}
							onClick={() => {
								if (pendingDelete) {
									deleteMutation.mutate(pendingDelete.categoryId);
								}
							}}
						>
							{deleteMutation.isPending ? "삭제 중…" : "삭제"}
						</Button>
					</Dialog.Actions>
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}

function showError(
	error: unknown,
	enqueue: ReturnType<typeof useSnackbar>["enqueue"],
) {
	enqueue(
		error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
		{ title: "오류" },
	);
}

export default TopicCategorySettings;
