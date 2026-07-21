import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServerData, TopicDetails } from "juicer-shared";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
	TopicAssociationDialog,
	type TopicAssociationOption,
} from "@/features/topic-associations";
import { topicQueryKeys } from "@/shared/api/query-keys/topic-query-keys";
import { useUnsavedChangesWarning } from "@/shared/browser/use-unsaved-changes-warning";
import { updateTopic } from "../api/mutations";
import {
	getTopicEditDefaultValues,
	normalizeIds,
	normalizeTopicEditValues,
	noTopicCategoryValue,
	type TopicEditFormValues,
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
}

export function TopicEditContent({
	serverId,
	serverData,
	topicId,
	topic,
}: TopicEditContentProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const form = useForm<TopicEditFormValues>({
		defaultValues: getTopicEditDefaultValues(topic),
		mode: "onChange",
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
	const submit = form.handleSubmit(async (values) => {
		if (mutation.isPending) {
			return;
		}

		const normalizedValues = normalizeTopicEditValues(values);

		try {
			await mutation.mutateAsync({
				serverId,
				topicId,
				name: normalizedValues.name,
				description: normalizedValues.description,
				categoryId:
					normalizedValues.categoryId === noTopicCategoryValue
						? null
						: Number(normalizedValues.categoryId),
				channelIds: normalizedValues.channelIds,
				roleIds: normalizedValues.roleIds,
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
			form.reset(normalizedValues);
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
		() =>
			new Map(
				(serverData.serverDataDiscord.channels ?? []).map((channel) => [
					channel.id,
					channel,
				]),
			),
		[serverData.serverDataDiscord.channels],
	);
	const rolesById = useMemo(
		() =>
			new Map(
				(serverData.serverDataDiscord.roles ?? []).map((role) => [
					role.id,
					role,
				]),
			),
		[serverData.serverDataDiscord.roles],
	);
	const channelOptions: TopicAssociationOption[] = useMemo(
		() =>
			(serverData.serverDataDiscord.channels ?? []).map((channel) => ({
				id: channel.id,
				label: `#${channel.name}`,
				headline: `#${channel.name}`,
			})),
		[serverData.serverDataDiscord.channels],
	);
	const roleOptions: TopicAssociationOption[] = useMemo(() => {
		const dbRoleIds = new Set(
			(serverData.serverDataDb?.roles ?? []).map((role) => role.roleId),
		);
		return (serverData.serverDataDiscord.roles ?? [])
			.filter(
				(role) =>
					dbRoleIds.has(role.id) && role.name !== "@everyone" && !role.managed,
			)
			.map((role) => ({
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
			}));
	}, [serverData.serverDataDb?.roles, serverData.serverDataDiscord.roles]);

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
