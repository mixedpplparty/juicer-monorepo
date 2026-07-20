import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { Fab } from "@mixedpplparty/juicer-m3/fab";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { CircularProgress } from "@mixedpplparty/juicer-m3/progress";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { Select } from "@mixedpplparty/juicer-m3/select";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { TextField } from "@mixedpplparty/juicer-m3/text-field";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServerData, TopicDetails } from "juicer-shared";
import { SaveIcon } from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { useUnsavedChangesWarning } from "../../../hooks/use-unsaved-changes-warning";
import { topicDetailsQueryOptions } from "../../api/queries";
import { updateTopic } from "../api/mutations";
import TopicAssociationDialog, {
	type TopicAssociationOption,
} from "./topic-association-dialog";
import { topicEditPageStyles } from "./topic-edit-content.styles";

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
					queryKey: topicDetailsQueryOptions(serverId, topicId).queryKey,
				}),
				queryClient.refetchQueries({
					queryKey: ["topics", serverId],
					type: "active",
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

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
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

	return (
		<div css={topicEditPageStyles.root}>
			<form css={topicEditPageStyles.form} onSubmit={handleSubmit}>
				<div css={topicEditPageStyles.fields}>
					<TextField
						label="주제명"
						variant="filled"
						required
						disabled={mutation.isPending}
						value={name}
						onChange={(event) => setName(event.currentTarget.value)}
					/>
					<TextField
						label="설명 (선택)"
						variant="filled"
						disabled={mutation.isPending}
						value={description}
						onChange={(event) => setDescription(event.currentTarget.value)}
					/>
					<Select.Root
						items={categoryItems}
						value={categoryId === null ? "none" : String(categoryId)}
						disabled={mutation.isPending}
						onValueChange={(value) =>
							setCategoryId(value && value !== "none" ? Number(value) : null)
						}
						css={topicEditPageStyles.fullWidth}
					>
						<Select.Label>카테고리 (선택)</Select.Label>
						<Select.Trigger css={topicEditPageStyles.categoryField}>
							<Select.Value placeholder="카테고리 선택" />
							<Select.Icon />
						</Select.Trigger>
						<Select.Popup>
							<Select.List>
								{categoryItems.map((category) => (
									<Select.Item key={category.value} value={category.value}>
										<Select.ItemIndicator />
										<Select.ItemText>{category.label}</Select.ItemText>
									</Select.Item>
								))}
							</Select.List>
						</Select.Popup>
					</Select.Root>
				</div>

				<AssociationList
					title="연관 채널"
					addLabel="연관 채널 추가하기"
					items={channelIds.flatMap((channelId) => {
						const channel = channelsById.get(channelId);
						return channel
							? [{ id: channel.id, headline: `#${channel.name}` }]
							: [];
					})}
					disabled={mutation.isPending}
					onAdd={() => setChannelDialogOpen(true)}
					onRemove={(channelId) =>
						setChannelIds((current) => current.filter((id) => id !== channelId))
					}
				/>

				<AssociationList
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
					disabled={mutation.isPending}
					onAdd={() => setRoleDialogOpen(true)}
					onRemove={(roleId) =>
						setRoleIds((current) => current.filter((id) => id !== roleId))
					}
				/>

				<Fab
					type="submit"
					aria-label={mutation.isPending ? "주제 저장 중" : "주제 저장"}
					disabled={mutation.isPending || !name.trim() || !hasChanges}
					css={topicEditPageStyles.fab}
					icon={
						<span css={topicEditPageStyles.fabIcon}>
							{mutation.isPending ? (
								<CircularProgress
									size={24}
									aria-label="저장 중"
									css={topicEditPageStyles.fabProgress}
								/>
							) : (
								<SaveIcon aria-hidden="true" />
							)}
						</span>
					}
				/>
			</form>

			<TopicAssociationDialog
				open={channelDialogOpen}
				title="연관 채널 선택"
				options={channelOptions}
				selectedIds={channelIds}
				disabled={mutation.isPending}
				onOpenChange={setChannelDialogOpen}
				onConfirm={setChannelIds}
			/>
			<TopicAssociationDialog
				open={roleDialogOpen}
				title="연관 역할 선택"
				options={roleOptions}
				selectedIds={roleIds}
				disabled={mutation.isPending}
				onOpenChange={setRoleDialogOpen}
				onConfirm={setRoleIds}
			/>
		</div>
	);
}

interface AssociationListItem {
	id: string;
	headline: ReactNode;
}

interface AssociationListProps {
	title: string;
	addLabel: string;
	items: AssociationListItem[];
	disabled: boolean;
	onAdd: () => void;
	onRemove: (id: string) => void;
}

function AssociationList({
	title,
	addLabel,
	items,
	disabled,
	onAdd,
	onRemove,
}: AssociationListProps) {
	return (
		<section css={topicEditPageStyles.section}>
			<Text
				as="h2"
				typeRole="label"
				size="medium"
				css={topicEditPageStyles.sectionTitle}
			>
				{title}
			</Text>
			<List
				container="transparent"
				aria-label={`${title} 목록`}
				css={topicEditPageStyles.list}
			>
				{items.map((item) => (
					<ListItem
						key={item.id}
						css={topicEditPageStyles.listItem}
						headline={item.headline}
						trailing={
							<IconButton
								type="button"
								aria-label={`${title}에서 삭제`}
								disabled={disabled}
								onClick={() => onRemove(item.id)}
							>
								<DeleteIcon />
							</IconButton>
						}
					/>
				))}
				<ListItem
					css={[topicEditPageStyles.listItem, topicEditPageStyles.addItem]}
					render={
						<button
							type="button"
							disabled={disabled}
							onClick={disabled ? undefined : onAdd}
						/>
					}
					leading={<AddIcon />}
					headline={addLabel}
				/>
			</List>
		</section>
	);
}

function sameIds(left: string[], right: string[]) {
	if (left.length !== right.length) {
		return false;
	}
	const rightSet = new Set(right);
	return left.every((id) => rightSet.has(id));
}

export default TopicEditContent;
