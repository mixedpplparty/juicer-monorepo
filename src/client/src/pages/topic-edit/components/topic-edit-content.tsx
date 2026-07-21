import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import type { ServerData, TopicDetails } from "juicer-shared";
import { type FormEvent, useMemo, useState } from "react";
import {
	TopicAssociationDialog,
	type TopicAssociationOption,
} from "@/features/topic-associations";
import { useTopicEditor } from "../hooks/use-topic-editor";
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
	const editor = useTopicEditor({ serverId, topicId, topic });
	const [channelDialogOpen, setChannelDialogOpen] = useState(false);
	const [roleDialogOpen, setRoleDialogOpen] = useState(false);
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

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		editor.submit();
	};

	return (
		<div css={topicEditPageStyles.root}>
			<form css={topicEditPageStyles.form} onSubmit={handleSubmit}>
				<TopicFields
					name={editor.name}
					description={editor.description}
					categoryId={editor.categoryId}
					categoryItems={categoryItems}
					disabled={editor.isPending}
					onNameChange={editor.setName}
					onDescriptionChange={editor.setDescription}
					onCategoryIdChange={editor.setCategoryId}
				/>
				<TopicAssociationList
					title="연관 채널"
					addLabel="연관 채널 추가하기"
					items={editor.channelIds.flatMap((channelId) => {
						const channel = channelsById.get(channelId);
						return channel
							? [{ id: channel.id, headline: `#${channel.name}` }]
							: [];
					})}
					disabled={editor.isPending}
					onAdd={() => setChannelDialogOpen(true)}
					onRemove={(channelId) =>
						editor.setChannelIds((current) =>
							current.filter((id) => id !== channelId),
						)
					}
				/>
				<TopicAssociationList
					title="연관 역할"
					addLabel="연관 역할 추가하기"
					items={editor.roleIds.flatMap((roleId) => {
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
					disabled={editor.isPending}
					onAdd={() => setRoleDialogOpen(true)}
					onRemove={(roleId) =>
						editor.setRoleIds((current) =>
							current.filter((id) => id !== roleId),
						)
					}
				/>
				<TopicSaveButton
					pending={editor.isPending}
					disabled={
						editor.isPending || !editor.name.trim() || !editor.hasChanges
					}
				/>
			</form>

			<TopicAssociationDialog
				open={channelDialogOpen}
				title="연관 채널 선택"
				options={channelOptions}
				selectedIds={editor.channelIds}
				disabled={editor.isPending}
				onOpenChange={setChannelDialogOpen}
				onConfirm={editor.setChannelIds}
			/>
			<TopicAssociationDialog
				open={roleDialogOpen}
				title="연관 역할 선택"
				options={roleOptions}
				selectedIds={editor.roleIds}
				disabled={editor.isPending}
				onOpenChange={setRoleDialogOpen}
				onConfirm={editor.setRoleIds}
			/>
		</div>
	);
}

export default TopicEditContent;
