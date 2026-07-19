import { Text } from "@mixedpplparty/juicer-m3/text";
import type { ServerData } from "juicer-shared";
import { Suspense, useState } from "react";
import AdminFabMenu from "./admin-fab-menu";
import {
	MyServerProfileSkeleton,
	TopicListSkeleton,
} from "./loading-skeletons";
import MyServerProfile from "./my-server-profile";
import { serverInfoStyles } from "./server-info.styles";
import TopicAddDialog from "./topic-add-dialog";
import TopicList from "./topic-list";

export interface ServerInfoProps {
	serverId: string;
	serverData: ServerData;
	searchQuery: string;
}

export function ServerInfo({
	serverId,
	serverData,
	searchQuery,
}: ServerInfoProps) {
	const [isTopicAddDialogOpen, setIsTopicAddDialogOpen] = useState(false);

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
					<TopicList
						serverId={serverId}
						serverData={serverData}
						searchQuery={searchQuery}
					/>
				</Suspense>
			</section>
			{serverData.admin && (
				<Suspense fallback={null}>
					<AdminFabMenu onAddTopic={() => setIsTopicAddDialogOpen(true)} />
					<TopicAddDialog
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

export default ServerInfo;
