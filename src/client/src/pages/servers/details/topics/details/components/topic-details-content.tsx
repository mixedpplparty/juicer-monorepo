import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
	Checkbox,
	CircularProgress,
	List,
	ListItem,
	RoleIndicator,
	Text,
	useSnackbar,
} from "juicer-m3";
import type { TopicDetailsRole } from "juicer-shared";
import { useOutletContext, useParams } from "react-router";
import type { ServerDetailsOutletContext } from "../../../server-details-context";
import { topicDetailsQueryOptions } from "../../api/queries";
import { setRoleAssignment } from "../api/mutations";
import { topicDetailsPageStyles } from "../topic-details-page.styles";

export function TopicDetailsContent() {
	const { serverId } = useOutletContext<ServerDetailsOutletContext>();
	const topicId = Number(useParams().topicId);

	if (!Number.isInteger(topicId)) {
		throw new Error("올바르지 않은 주제 ID입니다.");
	}

	const { data: topic, refetch } = useSuspenseQuery(
		topicDetailsQueryOptions(serverId, topicId),
	);

	return (
		<main css={topicDetailsPageStyles.root}>
			<DetailField label="설명">
				<Text
					as="p"
					typeRole="body"
					size="large"
					css={topicDetailsPageStyles.value}
				>
					{topic.description || "설명이 없습니다."}
				</Text>
			</DetailField>

			<DetailField label="카테고리">
				<Text
					as="p"
					typeRole="body"
					size="large"
					css={topicDetailsPageStyles.value}
				>
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
								role={role}
								refetchTopic={refetch}
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
		</main>
	);
}

interface DetailFieldProps {
	label: string;
	children: React.ReactNode;
}

function DetailField({ label, children }: DetailFieldProps) {
	return (
		<section css={topicDetailsPageStyles.field}>
			<Text
				as="h2"
				typeRole="label"
				size="large"
				css={topicDetailsPageStyles.label}
			>
				{label}
			</Text>
			{children}
		</section>
	);
}

interface TopicRoleItemProps {
	serverId: string;
	role: TopicDetailsRole;
	refetchTopic: () => Promise<unknown>;
}

function TopicRoleItem({ serverId, role, refetchTopic }: TopicRoleItemProps) {
	const { enqueue } = useSnackbar();
	const mutation = useMutation({
		mutationFn: setRoleAssignment,
		onSuccess: async (_, variables) => {
			await refetchTopic();
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

	return (
		<ListItem
			css={[
				topicDetailsPageStyles.roleItem,
				disabled && topicDetailsPageStyles.roleItemDisabled,
			]}
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
					{mutation.isPending ? (
						<CircularProgress size={24} aria-label="역할 변경 중" />
					) : (
						<Checkbox
							checked={role.assigned}
							disabled={!role.selfAssignable}
							aria-label={`${role.name} 역할 ${role.assigned ? "해제" : "할당"}`}
							onCheckedChange={(assigned) =>
								mutation.mutate({
									serverId,
									roleId: role.id,
									assigned,
								})
							}
						/>
					)}
				</span>
			}
		/>
	);
}

export default TopicDetailsContent;
