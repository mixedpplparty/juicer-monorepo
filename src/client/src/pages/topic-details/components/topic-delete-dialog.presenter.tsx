import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";
import { useLoading } from "@/shared/async/use-loading";
import { deleteTopic } from "../api/mutations";
export interface TopicDeleteDialogProps {
	serverId: string;
	topicId: number;
	topicName: string;
}

function useTopicDeleteDialogModel({
	serverId,
	topicId,
	topicName,
}: TopicDeleteDialogProps) {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const [removeTopicPending, withRemoveTopic] = useLoading();

	async function removeTopic() {
		if (removeTopicPending) return;
		await withRemoveTopic(async () => {
			try {
				await deleteTopic({ serverId, topicId });

				queryClient.removeQueries({
					queryKey: topicQueryKeys.details.detail(serverId, topicId),
				});
				await queryClient.invalidateQueries({
					queryKey: topicQueryKeys.lists.byServer(serverId),
				});
				enqueue("주제를 삭제했습니다.");
				navigate(`/servers/${serverId}`, { replace: true });
			} catch (error) {
				enqueue(
					error instanceof Error
						? error.message
						: "주제를 삭제하지 못했습니다.",
					{ title: "오류" },
				);
			}
		});
	}
	return {
		topicName,
		open,
		setOpen,
		removeTopicPending,
		removeTopic,
	};
}
export type TopicDeleteDialogViewModel = ReturnType<
	typeof useTopicDeleteDialogModel
>;
export function TopicDeleteDialogPresenter({
	children,
	...props
}: TopicDeleteDialogProps & {
	children: (model: TopicDeleteDialogViewModel) => ReactNode;
}) {
	const model = useTopicDeleteDialogModel(props);
	return children(model);
}
