import { AppBar } from "@mixedpplparty/juicer-m3/app-bar";
import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { ArrowBackIcon } from "@mixedpplparty/juicer-m3/icons/arrow-back";
import { EditIcon } from "@mixedpplparty/juicer-m3/icons/edit";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { appBarStyles } from "@/shared/styles/app-bar";
import { useScrollState } from "../../hooks/use-scroll-state";
import { topicDetailsPageStyles } from "../topics/details/topic-details-page.styles";

interface ServerPageAppBarProps {
	title: string;
	subtitle?: string;
	backTo: string;
	backLabel: string;
	actions?: ReactNode;
}

export function ServerPageAppBar({
	title,
	subtitle,
	backTo,
	backLabel,
	actions,
}: ServerPageAppBarProps) {
	const scroll = useScrollState<HTMLElement>();

	return (
		<AppBar
			ref={scroll.ref}
			title={
				subtitle ? (
					<span css={topicDetailsPageStyles.appBarTitle}>
						<Text
							typeRole="title"
							size="large"
							css={topicDetailsPageStyles.appBarTopicName}
						>
							{title}
						</Text>
						<Text
							typeRole="body"
							size="small"
							css={topicDetailsPageStyles.appBarServerName}
						>
							{subtitle}
						</Text>
					</span>
				) : (
					title
				)
			}
			container="transparent"
			data-scrolled={scroll.isScrolled}
			css={[appBarStyles.root, appBarStyles.insetInServerPage]}
			leading={
				<IconButton
					aria-label={backLabel}
					render={<Link to={backTo} />}
				>
					<ArrowBackIcon />
				</IconButton>
			}
			actions={actions}
		/>
	);
}

interface TopicAppBarProps {
	serverId: string;
	topicId: number;
	topicName: string;
	serverName: string;
	admin: boolean;
	mode: "topic" | "topic-edit";
}

export function TopicAppBar({
	serverId,
	topicId,
	topicName,
	serverName,
	admin,
	mode,
}: TopicAppBarProps) {
	const editing = mode === "topic-edit";

	return (
		<ServerPageAppBar
			title={editing ? "주제 편집" : topicName}
			subtitle={editing ? topicName : `@${serverName}`}
			backTo={
				editing
					? `/servers/${serverId}/topics/${topicId}`
					: `/servers/${serverId}`
			}
			backLabel={editing ? "주제 상세로 돌아가기" : "주제 목록으로 돌아가기"}
			actions={
				admin && !editing ? (
					<IconButton
						aria-label="주제 편집"
						render={
							<Link to={`/servers/${serverId}/topics/${topicId}/edit`} />
						}
					>
						<EditIcon />
					</IconButton>
				) : undefined
			}
		/>
	);
}
