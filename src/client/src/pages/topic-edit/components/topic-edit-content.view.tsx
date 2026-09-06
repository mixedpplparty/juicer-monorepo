import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { TopicAssociationDialog } from "@/features/topic-associations";
import TopicAssociationList from "./topic-association-list.view";
import type { TopicEditContentViewModel } from "./topic-edit-content.presenter";
import { topicEditPageStyles } from "./topic-edit-content.styles";
import TopicFields from "./topic-fields.view";
import TopicSaveButton from "./topic-save-button.view";
export function TopicEditContentView({
	control,
	removeChannel,
	removeRole,
	canSave,
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
}: TopicEditContentViewModel) {
	return (
		<div css={topicEditPageStyles.root}>
			<form css={topicEditPageStyles.form} onSubmit={submit}>
				<TopicFields
					control={control}
					categoryItems={categoryItems}
					disabled={isPending}
				/>
				<TopicAssociationList
					title="연관 채널"
					addLabel="연관 채널 추가하기"
					items={selectedChannels}
					disabled={isPending}
					onAdd={() => setChannelDialogOpen(true)}
					onRemove={removeChannel}
				/>
				<TopicAssociationList
					title="연관 역할"
					addLabel="연관 역할 추가하기"
					items={selectedRoles.map((role) => ({
						id: role.id,
						headline: (
							<RoleIndicator
								roleName={role.name}
								color={role.color}
								typeRole="body"
								size="large"
							/>
						),
					}))}
					disabled={isPending}
					onAdd={() => setRoleDialogOpen(true)}
					onRemove={removeRole}
				/>
				<TopicSaveButton pending={isPending} disabled={!canSave} />
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
				options={roleOptions.map((role) => ({
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
				}))}
				selectedIds={roleIds}
				disabled={isPending}
				onOpenChange={setRoleDialogOpen}
				onConfirm={setRoleIds}
			/>
		</div>
	);
}
