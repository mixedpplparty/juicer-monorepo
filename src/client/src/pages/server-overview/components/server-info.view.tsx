import { Text } from "@mixedpplparty/juicer-m3/text";
import { Suspense } from "react";
import {
	MyServerProfileSkeleton,
	TopicListSkeleton,
} from "@/features/server/components/loading-skeletons";
import AdminFabMenu from "./admin-fab-menu";
import MyServerProfile from "./my-server-profile";
import type { ServerInfoViewModel } from "./server-info.presenter";
import { serverInfoStyles } from "./server-info.styles";
import { TopicAddSection } from "./topic-add-section";
import TopicList from "./topic-list";
export function ServerInfoView({
	serverId,
	serverData,
	debouncedSearchQuery,
	isTopicAddDialogOpen,
	setIsTopicAddDialogOpen,
}: ServerInfoViewModel) {
	return (
		<div css={serverInfoStyles.root}>
			<section css={serverInfoStyles.section}>
				<Text
					as="h2"
					typeRole="label"
					size="large"
					css={serverInfoStyles.heading}
				>
					내 프로필
				</Text>
				<Suspense fallback={<MyServerProfileSkeleton />}>
					<MyServerProfile serverId={serverId} />
				</Suspense>
			</section>
			<section css={serverInfoStyles.section}>
				<Text
					as="h2"
					typeRole="label"
					size="large"
					css={serverInfoStyles.heading}
				>
					주제 목록
				</Text>
				<Suspense fallback={<TopicListSkeleton />}>
					<TopicList serverId={serverId} searchQuery={debouncedSearchQuery} />
				</Suspense>
			</section>
			{serverData.admin && (
				<Suspense fallback={null}>
					<AdminFabMenu onAddTopic={() => setIsTopicAddDialogOpen(true)} />
					<TopicAddSection
						searchQuery={debouncedSearchQuery}
						open={isTopicAddDialogOpen}
						serverId={serverId}
						serverData={serverData}
						onOpenChange={setIsTopicAddDialogOpen}
					/>
				</Suspense>
			)}
		</div>
	);
}
