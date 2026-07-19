import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import {
	myDataInServerQueryOptions,
	serverQueryOptions,
} from "../api/server-queries";
import MyServerProfile from "./my-server-profile";
import ServerHeader from "./server-header";

export interface ServerInfoProps {
	serverId: string;
}

export function ServerInfo({ serverId }: ServerInfoProps) {
	const { data: serverData } = useSuspenseQuery(serverQueryOptions(serverId));
	const { data: myDataInServer } = useSuspenseQuery(
		myDataInServerQueryOptions(serverId),
	);

	return (
		<section>
			<ServerHeader serverData={serverData} />
			<article>
				<Suspense fallback={<div>loading</div>}>
					<MyServerProfile myDataInServer={myDataInServer} />
				</Suspense>
			</article>
		</section>
	);
}

export default ServerInfo;
