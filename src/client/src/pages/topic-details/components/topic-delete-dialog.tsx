import { Button, IconButton } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";
import { deleteTopic } from "../api/mutations";
import { topicDeleteDialogStyles } from "./topic-delete-dialog.styles";

interface TopicDeleteDialogProps {
	serverId: string;
	topicId: number;
	topicName: string;
}

export function TopicDeleteDialog({
	serverId,
	topicId,
	topicName,
}: TopicDeleteDialogProps) {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const mutation = useMutation({
		mutationFn: deleteTopic,
		onSuccess: async () => {
			queryClient.removeQueries({
				queryKey: topicQueryKeys.details.detail(serverId, topicId),
			});
			await queryClient.invalidateQueries({
				queryKey: topicQueryKeys.lists.byServer(serverId),
			});
			enqueue("주제를 삭제했습니다.");
			navigate(`/servers/${serverId}`, { replace: true });
		},
		onError: (error) => {
			enqueue(
				error instanceof Error ? error.message : "주제를 삭제하지 못했습니다.",
				{ title: "오류" },
			);
		},
	});

	return (
		<>
			<IconButton
				type="button"
				aria-label="주제 삭제"
				disabled={mutation.isPending}
				css={topicDeleteDialogStyles.trigger}
				onClick={() => setOpen(true)}
			>
				<DeleteIcon />
			</IconButton>

			<Dialog.Root
				open={open}
				onOpenChange={(nextOpen) => !mutation.isPending && setOpen(nextOpen)}
			>
				<Dialog.Popup>
					<Dialog.Title>주제를 삭제할까요?</Dialog.Title>
					<Dialog.Description>
						‘{topicName}’ 주제와 연결된 역할 및 채널 정보가 삭제됩니다. 이
						작업은 되돌릴 수 없습니다.
					</Dialog.Description>
					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={mutation.isPending}
							onClick={() => setOpen(false)}
						>
							취소
						</Button>
						<Button
							type="button"
							disabled={mutation.isPending}
							css={topicDeleteDialogStyles.confirmButton}
							onClick={() => mutation.mutate({ serverId, topicId })}
						>
							{mutation.isPending ? "삭제 중…" : "삭제"}
						</Button>
					</Dialog.Actions>
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}

export default TopicDeleteDialog;
