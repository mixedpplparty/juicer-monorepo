import { useSuspenseQuery } from "@tanstack/react-query";
import { Text } from "juicer-m3";
import type { ServerData } from "juicer-shared";
import { lazy, Suspense, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
	myDataInServerQueryOptions,
	topicsQueryOptions,
} from "../api/server-queries";
import MyServerProfile from "./my-server-profile";
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
	const { data: myDataInServer } = useSuspenseQuery(
		myDataInServerQueryOptions(serverId),
	);
	const { data: topics } = useSuspenseQuery(
		topicsQueryOptions(serverId, debouncedSearchQuery),
	);

	return (
		<section>
			<article>
				<Text typeRole="title" size="large">
					내 프로필
				</Text>
				<MyServerProfile myDataInServer={myDataInServer} />
			</article>
			<Text typeRole="title" size="large">
				주제 목록
			</Text>
			<TopicList
				topics={topics}
				serverData={serverData}
				searchQuery={debouncedSearchQuery}
			/>
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
		</section>
	);
}

export default ServerInfo;
