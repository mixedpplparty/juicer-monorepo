import { useSuspenseQuery } from "@tanstack/react-query";
import { AppBar, ArrowBackIcon, EditIcon, IconButton, Text } from "juicer-m3";
import { useState } from "react";
import { Outlet, useMatches, useNavigate } from "react-router";
import { appBarStyles } from "@/shared/styles/app-bar";
import { useScrollState } from "../../hooks/use-scroll-state";
import { serverQueryOptions } from "../api/queries";
import { useRequiredServerId } from "../hooks/use-required-server-id";
import type { ServerDetailsOutletContext } from "../server-details-context";
import { serverDetailsPageStyles } from "../server-details-page.styles";
import { topicDetailsQueryOptions } from "../topics/api/queries";
import { topicDetailsPageStyles } from "../topics/details/topic-details-page.styles";
import ServerHeader from "./server-header";

export interface ServerPageHandle {
	serverAppBarKind?: "topic" | "topic-edit";
	serverAppBarTitle?: string;
	serverAppBarSubtitle?: "server-name";
	serverContentSkeleton?: "settings" | "topic" | "topic-edit";
}

export function ServerDetailsLayoutContent() {
	const serverId = useRequiredServerId();
	const navigate = useNavigate();
	const matches = useMatches();
	const [searchQuery, setSearchQuery] = useState("");
	const staticAppBarScroll = useScrollState<HTMLElement>();

	const activeHandle = matches.at(-1)?.handle as ServerPageHandle | undefined;
	const appBarTitle = activeHandle?.serverAppBarTitle;
	const appBarSubtitle = activeHandle?.serverAppBarSubtitle;
	const topicAppBarKind = activeHandle?.serverAppBarKind;
	const topicId = Number(matches.at(-1)?.params.topicId);
	const isTopicAppBar =
		topicAppBarKind !== undefined && Number.isInteger(topicId);
	const { data: serverData } = useSuspenseQuery(serverQueryOptions(serverId));

	const outletContext: ServerDetailsOutletContext = {
		serverId,
		serverData,
		searchQuery,
	};

	return (
		<div css={serverDetailsPageStyles.root}>
			{isTopicAppBar ? (
				<TopicDetailsAppBar
					serverId={serverId}
					topicId={topicId}
					serverName={serverData.serverDataDiscord.name}
					admin={serverData.admin}
					mode={topicAppBarKind ?? "topic"}
				/>
			) : appBarTitle ? (
				<AppBar
					ref={staticAppBarScroll.ref}
					title={
						appBarSubtitle === "server-name" ? (
							<span css={topicDetailsPageStyles.appBarTitle}>
								<Text
									typeRole="title"
									size="large"
									css={topicDetailsPageStyles.appBarTopicName}
								>
									{appBarTitle}
								</Text>
								<Text
									typeRole="body"
									size="small"
									css={topicDetailsPageStyles.appBarServerName}
								>
									@{serverData.serverDataDiscord.name}
								</Text>
							</span>
						) : (
							appBarTitle
						)
					}
					container="transparent"
					data-scrolled={staticAppBarScroll.isScrolled}
					css={[appBarStyles.root, appBarStyles.insetInServerPage]}
					leading={
						<IconButton
							type="button"
							aria-label="서버 상세로 돌아가기"
							onClick={() => navigate(`/servers/${serverId}`)}
						>
							<ArrowBackIcon />
						</IconButton>
					}
				/>
			) : (
				<ServerHeader
					serverData={serverData}
					searchQuery={searchQuery}
					onSearchQueryChange={setSearchQuery}
				/>
			)}
			<div css={serverDetailsPageStyles.content}>
				<Outlet context={outletContext} />
			</div>
		</div>
	);
}

interface TopicDetailsAppBarProps {
	serverId: string;
	topicId: number;
	serverName: string;
	admin: boolean;
	mode: "topic" | "topic-edit";
}

function TopicDetailsAppBar({
	serverId,
	topicId,
	serverName,
	admin,
	mode,
}: TopicDetailsAppBarProps) {
	const navigate = useNavigate();
	const appBarScroll = useScrollState<HTMLElement>();
	const { data: topic } = useSuspenseQuery(
		topicDetailsQueryOptions(serverId, topicId),
	);

	return (
		<AppBar
			ref={appBarScroll.ref}
			title={
				<span css={topicDetailsPageStyles.appBarTitle}>
					<Text
						typeRole="title"
						size="large"
						css={topicDetailsPageStyles.appBarTopicName}
					>
						{mode === "topic-edit" ? "주제 편집" : topic.name}
					</Text>
					<Text
						typeRole="body"
						size="small"
						css={topicDetailsPageStyles.appBarServerName}
					>
						{mode === "topic-edit" ? topic.name : `@${serverName}`}
					</Text>
				</span>
			}
			container="transparent"
			data-scrolled={appBarScroll.isScrolled}
			css={[appBarStyles.root, appBarStyles.insetInServerPage]}
			leading={
				<IconButton
					type="button"
					aria-label={
						mode === "topic-edit"
							? "주제 상세로 돌아가기"
							: "주제 목록으로 돌아가기"
					}
					onClick={() =>
						navigate(
							mode === "topic-edit"
								? `/servers/${serverId}/topics/${topicId}`
								: `/servers/${serverId}`,
						)
					}
				>
					<ArrowBackIcon />
				</IconButton>
			}
			actions={
				admin && mode === "topic" ? (
					<IconButton
						type="button"
						aria-label="주제 편집"
						onClick={() =>
							navigate(`/servers/${serverId}/topics/${topicId}/edit`)
						}
					>
						<EditIcon />
					</IconButton>
				) : undefined
			}
		/>
	);
}

export default ServerDetailsLayoutContent;
