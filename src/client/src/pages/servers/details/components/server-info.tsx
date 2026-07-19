import { useSuspenseQueries } from "@tanstack/react-query";
import { Text } from "juicer-m3/text";
import type { ServerData } from "juicer-shared";
import { lazy, Suspense, useState } from "react";
import { myDataInServerQueryOptions, topicsQueryOptions } from "../api/queries";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import MyServerProfile from "./my-server-profile";
import { serverInfoStyles } from "./server-info.styles";
import TopicList from "./topic-list";

const AdminFabMenu = lazy(() => import("./admin-fab-menu"));
const TopicAddDialog = lazy(() => import("./topic-add-dialog"));

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
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
	const [{ data: myDataInServer }, { data: topics }] = useSuspenseQueries({
		queries: [
			myDataInServerQueryOptions(serverId),
			topicsQueryOptions(serverId, debouncedSearchQuery),
		],
	});

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
				<MyServerProfile myDataInServer={myDataInServer} />
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
				<TopicList
					topics={topics}
					serverData={serverData}
					searchQuery={debouncedSearchQuery}
				/>
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
