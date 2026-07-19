import { Checkbox } from "@mixedpplparty/juicer-m3/checkbox";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TopicDetails, TopicDetailsRole } from "juicer-shared";
import { topicDetailsQueryOptions } from "../../api/queries";
import { setRoleAssignment } from "../api/mutations";
import { topicDetailsPageStyles } from "../topic-details-page.styles";

interface TopicDetailsContentProps {
	serverId: string;
	topicId: number;
	topic: TopicDetails;
}

export function TopicDetailsContent({
	serverId,
	topicId,
	topic,
}: TopicDetailsContentProps) {
	return (
		<div css={topicDetailsPageStyles.root}>
			<dl css={topicDetailsPageStyles.details}>
				<DetailField label="설명">
					<Text typeRole="body" size="large">
						{topic.description || "설명이 없습니다."}
					</Text>
				</DetailField>

				<DetailField label="카테고리">
					<Text typeRole="body" size="large">
						{topic.category?.name || "카테고리가 없습니다."}
					</Text>
				</DetailField>

				<DetailField label="연관 채널">
					<div css={topicDetailsPageStyles.channels}>
						{topic.channels.length > 0 ? (
							topic.channels.map((channel) => (
								<Text key={channel.id} typeRole="body" size="large">
									#{channel.name}
								</Text>
							))
						) : (
							<Text typeRole="body" size="large">
								연관 채널이 없습니다.
							</Text>
						)}
					</div>
				</DetailField>
			</dl>

			<section css={topicDetailsPageStyles.roles}>
				<Text
					as="h2"
					typeRole="title"
					size="medium"
					css={topicDetailsPageStyles.rolesTitle}
				>
					역할
				</Text>
				{topic.roles.length > 0 ? (
					<List
						container="transparent"
						aria-label="주제 역할"
						css={topicDetailsPageStyles.roleList}
					>
						{topic.roles.map((role) => (
							<TopicRoleItem
								key={role.id}
								serverId={serverId}
								topicId={topicId}
								role={role}
							/>
						))}
					</List>
				) : (
					<Text
						as="p"
						typeRole="body"
						size="medium"
						css={topicDetailsPageStyles.emptyRoles}
					>
						연관 역할이 없습니다.
					</Text>
				)}
			</section>
		</div>
	);
}

interface DetailFieldProps {
	label: string;
	children: React.ReactNode;
}

function DetailField({ label, children }: DetailFieldProps) {
	return (
		<div css={topicDetailsPageStyles.field}>
			<Text
				as="dt"
				typeRole="label"
				size="large"
				css={topicDetailsPageStyles.label}
			>
				{label}
			</Text>
			<dd css={topicDetailsPageStyles.detailValue}>{children}</dd>
		</div>
	);
}

interface TopicRoleItemProps {
	serverId: string;
	topicId: number;
	role: TopicDetailsRole;
}

function TopicRoleItem({ serverId, topicId, role }: TopicRoleItemProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const mutation = useMutation({
		mutationFn: setRoleAssignment,
		onSuccess: async (_, variables) => {
			await queryClient.invalidateQueries({
				queryKey: topicDetailsQueryOptions(serverId, topicId).queryKey,
			});
			enqueue(
				variables.assigned
					? `${role.name} 역할을 추가했습니다.`
					: `${role.name} 역할을 제거했습니다.`,
			);
		},
		onError: (error) => {
			enqueue(
				error instanceof Error ? error.message : "역할을 변경하지 못했습니다.",
				{ title: "오류" },
			);
		},
	});
	const disabled = mutation.isPending || !role.selfAssignable;
	const toggleRole = () => {
		if (!disabled) {
			mutation.mutate({
				serverId,
				roleId: role.id,
				assigned: !role.assigned,
			});
		}
	};

	return (
		<ListItem
			aria-disabled={disabled || undefined}
			css={[
				topicDetailsPageStyles.roleItem,
				disabled && topicDetailsPageStyles.roleItemDisabled,
			]}
			onClick={disabled ? undefined : toggleRole}
			headline={
				<RoleIndicator
					roleName={role.name}
					color={role.color}
					typeRole="body"
					size="large"
				/>
			}
			supportingText={role.description || undefined}
			leading={
				<span css={topicDetailsPageStyles.roleControl}>
					<Checkbox
						checked={role.assigned}
						disabled={disabled}
						aria-label={`${role.name} 역할 ${role.assigned ? "해제" : "할당"}`}
						onClick={(event) => event.stopPropagation()}
						onCheckedChange={(assigned) =>
							mutation.mutate({
								serverId,
								roleId: role.id,
								assigned,
							})
						}
					/>
				</span>
			}
		/>
	);
}

export default TopicDetailsContent;
