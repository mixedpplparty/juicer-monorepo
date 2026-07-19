import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useOutletContext, useParams } from "react-router";
import { TopicAppBarSkeleton } from "../../components/loading-skeletons";
import { TopicAppBar } from "../../components/server-page-app-bar";
import type { ServerDetailsOutletContext } from "../../server-details-context";
import { serverDetailsPageStyles } from "../../server-details-page.styles";
import { topicDetailsQueryOptions } from "../api/queries";
import TopicDetailsContent from "./components/topic-details-content";
import { TopicDetailsSkeleton } from "./components/topic-details-skeleton";

export function TopicDetailsPage() {
	return (
		<Suspense fallback={<TopicDetailsPageSkeleton />}>
			<TopicDetailsRoute />
		</Suspense>
	);
}

function TopicDetailsRoute() {
	const { serverId, serverData } =
		useOutletContext<ServerDetailsOutletContext>();
	const topicId = Number(useParams().topicId);

	if (!Number.isInteger(topicId)) {
		throw new Error("올바르지 않은 주제 ID입니다.");
	}

	const { data: topic } = useSuspenseQuery(
		topicDetailsQueryOptions(serverId, topicId),
	);

	return (
		<>
			<TopicAppBar
				serverId={serverId}
				topicId={topicId}
				topicName={topic.name}
				serverName={serverData.serverDataDiscord.name}
				admin={serverData.admin}
				mode="topic"
			/>
			<div css={serverDetailsPageStyles.content}>
				<TopicDetailsContent
					serverId={serverId}
					topicId={topicId}
					topic={topic}
				/>
			</div>
		</>
	);
}

function TopicDetailsPageSkeleton() {
	return (
		<>
			<TopicAppBarSkeleton />
			<div css={serverDetailsPageStyles.content}>
				<TopicDetailsSkeleton />
			</div>
		</>
	);
}

export default TopicDetailsPage;
