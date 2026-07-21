import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TopicDetails } from "juicer-shared";
import { useState } from "react";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";
import { useUnsavedChangesWarning } from "@/shared/browser/use-unsaved-changes-warning";
import { updateTopic } from "../api/mutations";

interface UseTopicEditorOptions {
	serverId: string;
	topicId: number;
	topic: TopicDetails;
}

export function useTopicEditor({
	serverId,
	topicId,
	topic,
}: UseTopicEditorOptions) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const [name, setName] = useState(topic.name);
	const [description, setDescription] = useState(topic.description ?? "");
	const [categoryId, setCategoryId] = useState<number | null>(
		topic.category?.categoryId ?? null,
	);
	const [channelIds, setChannelIds] = useState(() =>
		topic.channels.map((channel) => channel.id),
	);
	const [roleIds, setRoleIds] = useState(() =>
		topic.roles.map((role) => role.id),
	);

	const hasChanges =
		name !== topic.name ||
		description !== (topic.description ?? "") ||
		categoryId !== (topic.category?.categoryId ?? null) ||
		!sameIds(
			channelIds,
			topic.channels.map((channel) => channel.id),
		) ||
		!sameIds(
			roleIds,
			topic.roles.map((role) => role.id),
		);

	useUnsavedChangesWarning(hasChanges);

	const mutation = useMutation({
		mutationFn: updateTopic,
		onSuccess: async () => {
			await Promise.all([
				queryClient.refetchQueries({
					queryKey: topicQueryKeys.details.detail(serverId, topicId),
				}),
				queryClient.invalidateQueries({
					queryKey: topicQueryKeys.lists.byServer(serverId),
					refetchType: "all",
				}),
			]);
			enqueue("주제를 저장했습니다.");
		},
		onError: (error) => {
			enqueue(
				error instanceof Error ? error.message : "주제를 저장하지 못했습니다.",
				{ title: "오류" },
			);
		},
	});

	const submit = () => {
		if (!name.trim() || mutation.isPending) {
			return;
		}

		mutation.mutate({
			serverId,
			topicId,
			name: name.trim(),
			description: description.trim(),
			categoryId,
			channelIds,
			roleIds,
		});
	};

	return {
		name,
		setName,
		description,
		setDescription,
		categoryId,
		setCategoryId,
		channelIds,
		setChannelIds,
		roleIds,
		setRoleIds,
		hasChanges,
		isPending: mutation.isPending,
		submit,
	};
}

function sameIds(left: string[], right: string[]) {
	if (left.length !== right.length) {
		return false;
	}
	const rightSet = new Set(right);
	return left.every((id) => rightSet.has(id));
}
