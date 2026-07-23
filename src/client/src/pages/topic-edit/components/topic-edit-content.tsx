import { zodResolver } from "@hookform/resolvers/zod";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	AssociableOptions,
	ServerData,
	TopicDetails,
} from "juicer-shared";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
	TopicAssociationDialog,
	type TopicAssociationOption,
} from "@/features/topic-associations";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";
import { useUnsavedChangesWarning } from "@/shared/browser/use-unsaved-changes-warning";
import {
	type TopicUpdateFormInput,
	type TopicUpdateFormOutput,
	topicUpdateFormSchema,
} from "@/shared/forms/form-schemas";
import { updateTopic } from "../api/mutations";
import {
	getTopicEditDefaultValues,
	getTopicEditResetValues,
	normalizeIds,
} from "../topic-edit-form";
import TopicAssociationList from "./topic-association-list";
import { topicEditPageStyles } from "./topic-edit-content.styles";
import TopicFields from "./topic-fields";
import TopicSaveButton from "./topic-save-button";

interface TopicEditContentProps {
	serverId: string;
	serverData: ServerData;
	topicId: number;
	topic: TopicDetails;
	associables: AssociableOptions;
}

export function TopicEditContent({
	serverId,
	serverData,
	topicId,
	topic,
	associables,
}: TopicEditContentProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
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

	useUnsavedChangesWarning(isDirty);

	const mutation = useMutation({
		mutationFn: updateTopic,
	});
	const isPending = mutation.isPending || isSubmitting;
	const setChannelIds = (ids: string[]) =>
		form.setValue("channelIds", normalizeIds(ids), { shouldDirty: true });
	const setRoleIds = (ids: string[]) =>
		form.setValue("roleIds", normalizeIds(ids), { shouldDirty: true });
	const submit = form.handleSubmit(async (body) => {
		if (mutation.isPending) {
			return;
		}

		try {
			await mutation.mutateAsync({
				serverId,
				topicId,
				body,
			});
			await Promise.all([
				queryClient.refetchQueries({
					queryKey: topicQueryKeys.details.detail(serverId, topicId),
				}),
				queryClient.invalidateQueries({
					queryKey: topicQueryKeys.lists.byServer(serverId),
					refetchType: "all",
				}),
			]);
			form.reset(getTopicEditResetValues(body));
			enqueue("주제를 저장했습니다.");
		} catch (error) {
			enqueue(
				error instanceof Error ? error.message : "주제를 저장하지 못했습니다.",
				{ title: "오류" },
			);
		}
	});

	const categoryItems = useMemo(
		() => [
			{ label: "선택 안 함", value: "none" },
			...(serverData.serverDataDb?.categories ?? []).map((category) => ({
				label: category.name,
				value: String(category.categoryId),
			})),
		],
		[serverData.serverDataDb?.categories],
	);
	const channelsById = useMemo(
		() => new Map(associables.channels.map((channel) => [channel.id, channel])),
		[associables.channels],
	);
	const rolesById = useMemo(
		() => new Map(associables.roles.map((role) => [role.id, role])),
		[associables.roles],
	);
	const channelOptions: TopicAssociationOption[] = useMemo(
		() =>
			associables.channels.map((channel) => ({
				id: channel.id,
				label: `#${channel.name}`,
				headline: `#${channel.name}`,
			})),
		[associables.channels],
	);
	const roleOptions: TopicAssociationOption[] = useMemo(
		() =>
			associables.roles.map((role) => ({
				id: role.id,
				label: role.name,
				headline: (
					<RoleIndicator
						roleName={role.name}
						color={role.color}
						typeRole="body"
						size="large"
					/>
				),
			})),
		[associables.roles],
	);

	return (
		<div css={topicEditPageStyles.root}>
			<form css={topicEditPageStyles.form} onSubmit={submit}>
				<TopicFields
					control={form.control}
					categoryItems={categoryItems}
					disabled={isPending}
				/>
				<TopicAssociationList
					title="연관 채널"
					addLabel="연관 채널 추가하기"
					items={channelIds.flatMap((channelId) => {
						const channel = channelsById.get(channelId);
						return channel
							? [{ id: channel.id, headline: `#${channel.name}` }]
							: [];
					})}
					disabled={isPending}
					onAdd={() => setChannelDialogOpen(true)}
					onRemove={(channelId) =>
						setChannelIds(channelIds.filter((id) => id !== channelId))
					}
				/>
				<TopicAssociationList
					title="연관 역할"
					addLabel="연관 역할 추가하기"
					items={roleIds.flatMap((roleId) => {
						const role = rolesById.get(roleId);
						return role
							? [
									{
										id: role.id,
										headline: (
											<RoleIndicator
												roleName={role.name}
												color={role.color}
												typeRole="body"
												size="large"
											/>
										),
									},
								]
							: [];
					})}
					disabled={isPending}
					onAdd={() => setRoleDialogOpen(true)}
					onRemove={(roleId) =>
						setRoleIds(roleIds.filter((id) => id !== roleId))
					}
				/>
				<TopicSaveButton
					pending={isPending}
					disabled={isPending || !isDirty || !isValid}
				/>
			</form>

			<TopicAssociationDialog
				open={channelDialogOpen}
				title="연관 채널 선택"
				options={channelOptions}
				selectedIds={channelIds}
				disabled={isPending}
				onOpenChange={setChannelDialogOpen}
				onConfirm={setChannelIds}
			/>
			<TopicAssociationDialog
				open={roleDialogOpen}
				title="연관 역할 선택"
				options={roleOptions}
				selectedIds={roleIds}
				disabled={isPending}
				onOpenChange={setRoleDialogOpen}
				onConfirm={setRoleIds}
			/>
		</div>
	);
}

export default TopicEditContent;
