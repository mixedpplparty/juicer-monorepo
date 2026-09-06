import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { EditIcon } from "@mixedpplparty/juicer-m3/icons/edit";
import { Suspense } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import { TopicAppBarSkeleton } from "@/features/server/components/loading-skeletons";
import { serverDetailsPageStyles } from "@/features/server/components/server-layout.styles";
import type { ServerDetailsOutletContext } from "@/features/server/model/server-details-context";
import { TopicAppBar } from "@/features/topics/components/topic-app-bar";
import { TopicDetailsFetch } from "@/features/topics/components/topic-details.fetch";
import TopicDeleteDialog from "./components/topic-delete-dialog";
import TopicDetailsContent from "./components/topic-details-content.view";
import { TopicDetailsSkeleton } from "./components/topic-details-skeleton";

export function TopicDetailsPage() {
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
							mode="topic"
							actions={
								<>
									<IconButton
										nativeButton={false}
										aria-label="주제 편집"
										render={
											<Link
												to={`/servers/${serverId}/topics/${topicId}/edit`}
											/>
										}
									>
										<EditIcon />
									</IconButton>
									<TopicDeleteDialog
										serverId={serverId}
										topicId={topicId}
										topicName={topic.name}
									/>
								</>
							}
						/>
					)}
				</TopicDetailsFetch>
			</Suspense>
			<div css={serverDetailsPageStyles.content}>
				<Suspense fallback={<TopicDetailsSkeleton />}>
					<TopicDetailsFetch serverId={serverId} topicId={topicId}>
						{(topic) => (
							<TopicDetailsContent serverId={serverId} topic={topic} />
						)}
					</TopicDetailsFetch>
				</Suspense>
			</div>
		</>
	);
}
export default TopicDetailsPage;
