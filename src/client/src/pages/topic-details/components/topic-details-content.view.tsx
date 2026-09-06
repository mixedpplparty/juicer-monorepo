import { List } from "@mixedpplparty/juicer-m3/list";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { TopicDetails } from "juicer-shared";
import { topicDetailsPageStyles } from "../topic-details-page.styles";
import TopicRoleItem from "./topic-role-item";

interface TopicDetailsContentProps {
	serverId: string;
	topic: TopicDetails;
}

export function TopicDetailsContent({
	serverId,
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
							<TopicRoleItem key={role.id} serverId={serverId} role={role} />
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

export default TopicDetailsContent;
