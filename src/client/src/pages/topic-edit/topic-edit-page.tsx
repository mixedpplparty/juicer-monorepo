import { Suspense } from "react";
import { useOutletContext, useParams } from "react-router";

import { TopicAppBarSkeleton } from "@/features/server/components/loading-skeletons";
import { serverDetailsPageStyles } from "@/features/server/components/server-layout.styles";
import type { ServerDetailsOutletContext } from "@/features/server/model/server-details-context";
import { TopicAppBar } from "@/features/topics/components/topic-app-bar";
import { TopicDetailsFetch } from "@/features/topics/components/topic-details.fetch";
import { TopicEditFetch } from "./components/topic-edit.fetch";
import TopicEditContent from "./components/topic-edit-content";
import { TopicEditSkeleton } from "./components/topic-edit-skeleton";

export function TopicEditPage() {
	const { serverId, serverData } =
		useOutletContext<ServerDetailsOutletContext>();
	const topicId = Number(useParams().topicId);
	if (!Number.isSafeInteger(topicId) || topicId <= 0)
		throw new Error("올바르지 않은 주제 ID입니다.");
	return (
		<>
			<Suspense fallback={<TopicAppBarSkeleton />}>
				<TopicDetailsFetch serverId={serverId} topicId={topicId}>
					{(topic) => (
						<TopicAppBar
							serverId={serverId}
							topicId={topicId}
							topicName={topic.name}
							serverName={serverData.serverDataDiscord.name}
							admin={serverData.admin}
							mode="topic-edit"
						/>
					)}
				</TopicDetailsFetch>
			</Suspense>
			<div css={serverDetailsPageStyles.content}>
				<Suspense fallback={<TopicEditSkeleton />}>
					<TopicEditFetch serverId={serverId} topicId={topicId}>
						{({ topic, associables, refetchTopic }) => (
							<TopicEditContent
								key={`${serverId}:${topicId}`}
								serverId={serverId}
								serverData={serverData}
								topicId={topicId}
								topic={topic}
								associables={associables}
								refetchTopic={refetchTopic}
							/>
						)}
					</TopicEditFetch>
				</Suspense>
			</div>
		</>
	);
}
export default TopicEditPage;
