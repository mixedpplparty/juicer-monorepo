import { useSuspenseQuery } from "@tanstack/react-query";
import type { ServerData } from "juicer-shared";
import type { ReactNode } from "react";
import type { Refetch } from "@/shared/api/refetch";
import { serverQueryOptions } from "../api/queries";

type Props = {
	serverId: string;
	children: (data: ServerData, refetch: Refetch) => ReactNode;
};

export function ServerDataFetch({ serverId, children }: Props) {
	const { data, refetch } = useSuspenseQuery(serverQueryOptions(serverId));
	return children(data, () => refetch({ throwOnError: true }));
}
