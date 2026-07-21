import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useOutletContext, useParams } from "react-router";
import { TopicAppBarSkeleton } from "@/pages/server-overview/components/loading-skeletons";
import { TopicAppBar } from "@/pages/server-overview/components/server-page-app-bar";
import type { ServerDetailsOutletContext } from "@/pages/server-overview/server-details-context";
import { serverDetailsPageStyles } from "@/pages/server-overview/server-details-page.styles";
import { topicDetailsQueryOptions } from "@/shared/api/topic-queries";
import TopicEditContent from "./components/topic-edit-content";
import { TopicEditSkeleton } from "./components/topic-edit-skeleton";

export function TopicEditPage() {
	return (
		<Suspense fallback={<TopicEditPageSkeleton />}>
			<TopicEditRoute />
		</Suspense>
	);
}

function TopicEditRoute() {
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
				mode="topic-edit"
			/>
			<div css={serverDetailsPageStyles.content}>
				<TopicEditContent
					key={topicId}
					serverId={serverId}
					serverData={serverData}
					topicId={topicId}
					topic={topic}
				/>
			</div>
		</>
	);
}

function TopicEditPageSkeleton() {
	return (
		<>
			<TopicAppBarSkeleton />
			<div css={serverDetailsPageStyles.content}>
				<TopicEditSkeleton />
			</div>
		</>
	);
}

export default TopicEditPage;
