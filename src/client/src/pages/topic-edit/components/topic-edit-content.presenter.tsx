import { zodResolver } from "@hookform/resolvers/zod";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useQueryClient } from "@tanstack/react-query";
import type {
	AssociableOptions,
	ServerData,
	TopicDetails,
} from "juicer-shared";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate } from "react-router";
import {
	type TopicUpdateFormInput,
	type TopicUpdateFormOutput,
	topicUpdateFormSchema,
} from "@/features/topics/model/topic-form-schema";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";
import type { Refetch } from "@/shared/api/refetch";
import { useLoading } from "@/shared/async/use-loading";
import { useUnsavedChangesWarning } from "@/shared/browser/use-unsaved-changes-warning";
import { updateTopic } from "../api/mutations";
import {
	getTopicAssociationModel,
	getTopicCategoryOptions,
} from "../topic-association-model";
import { getTopicEditDefaultValues, normalizeIds } from "../topic-edit-form";
export interface TopicEditContentProps {
	serverId: string;
	serverData: ServerData;
	topicId: number;
	topic: TopicDetails;
	associables: AssociableOptions;
	refetchTopic: Refetch;
}

function useTopicEditContentModel({
	serverId,
	serverData,
	topicId,
	topic,
	associables,
	refetchTopic,
}: TopicEditContentProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const navigate = useNavigate();
	const form = useForm<TopicUpdateFormInput, unknown, TopicUpdateFormOutput>({
		defaultValues: getTopicEditDefaultValues(topic),
		mode: "onChange",
		resolver: zodResolver(topicUpdateFormSchema),
	});
	const channelIds = useWatch({ control: form.control, name: "channelIds" });
	const roleIds = useWatch({ control: form.control, name: "roleIds" });
	const { isDirty, isSubmitting, isValid } = form.formState;
	const [channelDialogOpen, setChannelDialogOpen] = useState(false);
	const [roleDialogOpen, setRoleDialogOpen] = useState(false);
	const allowNavigation = useUnsavedChangesWarning(isDirty);
	const [isSaving, withSaving] = useLoading();
	const isPending = isSaving || isSubmitting;
	const setChannelIds = (ids: string[]) =>
		form.setValue("channelIds", normalizeIds(ids), { shouldDirty: true });
	const setRoleIds = (ids: string[]) =>
		form.setValue("roleIds", normalizeIds(ids), { shouldDirty: true });
	const submit = form.handleSubmit(async (body) => {
		if (isSaving) {
			return;
		}

		await withSaving(async () => {
			try {
				await updateTopic({
					serverId,
					topicId,
					body,
				});
				await Promise.all([
					refetchTopic(),
					queryClient.invalidateQueries({
						queryKey: topicQueryKeys.lists.byServer(serverId),
						refetchType: "all",
					}),
				]);
				enqueue("주제를 저장했습니다.");
				allowNavigation();
				await navigate(`/servers/${serverId}/topics/${topicId}`);
			} catch (error) {
				enqueue(
					error instanceof Error
						? error.message
						: "주제를 저장하지 못했습니다.",
					{ title: "오류" },
				);
			}
		});
	});
	const categoryItems = getTopicCategoryOptions(
		serverData.serverDataDb?.categories ?? [],
	);
	const { channelOptions, roleOptions, selectedChannels, selectedRoles } =
		getTopicAssociationModel(associables, channelIds, roleIds);
	const removeChannel = (channelId: string) =>
		setChannelIds(channelIds.filter((id) => id !== channelId));
	const removeRole = (roleId: string) =>
		setRoleIds(roleIds.filter((id) => id !== roleId));
	const canSave = !isPending && isDirty && isValid;
	return {
		removeChannel,
		removeRole,
		canSave,
		control: form.control,
		channelIds,
		roleIds,
		channelDialogOpen,
		setChannelDialogOpen,
		roleDialogOpen,
		setRoleDialogOpen,
		isPending,
		setChannelIds,
		setRoleIds,
		submit,
		categoryItems,
		selectedChannels,
		selectedRoles,
		channelOptions,
		roleOptions,
	};
}
export type TopicEditContentViewModel = ReturnType<
	typeof useTopicEditContentModel
>;
export function TopicEditContentPresenter({
	children,
	...props
}: TopicEditContentProps & {
	children: (model: TopicEditContentViewModel) => ReactNode;
}) {
	const model = useTopicEditContentModel(props);
	return children(model);
}
