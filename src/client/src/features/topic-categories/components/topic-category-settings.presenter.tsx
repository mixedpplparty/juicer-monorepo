import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useQueryClient } from "@tanstack/react-query";
import type { Category, NameRequiredRequestBody } from "juicer-shared";
import type { ReactNode } from "react";
import { useState } from "react";
import { invalidateServerTopicState } from "@/shared/api/query-invalidation";
import type { Refetch } from "@/shared/api/refetch";
import { useLoading } from "@/shared/async/use-loading";
import { showRequestError } from "@/shared/notifications/show-request-error";
import { createTopicCategory, deleteTopicCategory } from "../api/mutations";
export interface TopicCategorySettingsProps {
	serverId: string;
	refetchServer: Refetch;
	categories: Category[];
}

function useTopicCategorySettingsModel({
	serverId,
	refetchServer,
	categories,
}: TopicCategorySettingsProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const [creating, setCreating] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
	const [submitCategoryPending, withSubmitCategory] = useLoading();

	async function submitCategory(body: NameRequiredRequestBody) {
		if (submitCategoryPending) return;
		await withSubmitCategory(async () => {
			try {
				await createTopicCategory({ serverId, body });

				await refetchServer();
				setCreating(false);
				enqueue("주제 카테고리를 추가했습니다.");
			} catch (error) {
				showRequestError(error, enqueue);
			}
		});
	}
	const [removeCategoryPending, withRemoveCategory] = useLoading();

	async function removeCategory(categoryId: number) {
		if (removeCategoryPending) return;
		await withRemoveCategory(async () => {
			try {
				await deleteTopicCategory({ serverId, categoryId });

				await invalidateServerTopicState(queryClient, serverId);
				setPendingDelete(null);
				enqueue("주제 카테고리를 삭제했습니다.");
			} catch (error) {
				showRequestError(error, enqueue);
			}
		});
	}
	return {
		categories,
		creating,
		setCreating,
		pendingDelete,
		setPendingDelete,
		submitCategoryPending,
		submitCategory,
		removeCategoryPending,
		removeCategory,
	};
}
export type TopicCategorySettingsViewModel = ReturnType<
	typeof useTopicCategorySettingsModel
>;
export function TopicCategorySettingsPresenter({
	children,
	...props
}: TopicCategorySettingsProps & {
	children: (model: TopicCategorySettingsViewModel) => ReactNode;
}) {
	const model = useTopicCategorySettingsModel(props);
	return children(model);
}
