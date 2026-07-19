import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Text } from "juicer-m3";
import { lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
	myDataInServerQueryOptions,
	serverQueryOptions,
	topicsQueryOptions,
} from "../api/server-queries";
import MyServerProfile from "./my-server-profile";
import ServerHeader from "./server-header";
import TopicList from "./topic-list";

const AdminFabMenu = lazy(() => import("./admin-fab-menu"));

export interface ServerInfoProps {
	serverId: string;
}

export function ServerInfo({ serverId }: ServerInfoProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const navigate = useNavigate();
	const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
	const [{ data: serverData }, { data: myDataInServer }] = useSuspenseQueries({
		queries: [
			serverQueryOptions(serverId),
			myDataInServerQueryOptions(serverId),
		],
	});
	const { data: topics } = useSuspenseQuery(
		topicsQueryOptions(serverId, debouncedSearchQuery),
	);

	return (
		<section>
			<ServerHeader
				serverData={serverData}
				searchQuery={searchQuery}
				onSearchQueryChange={setSearchQuery}
			/>
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
					<AdminFabMenu
						onAddTopic={() => navigate("topics/new")}
						onOpenServerSettings={() => navigate("settings")}
					/>
				</Suspense>
			)}
		</section>
	);
}

export default ServerInfo;
