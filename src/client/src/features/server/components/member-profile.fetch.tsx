import { useSuspenseQuery } from "@tanstack/react-query";
import type { MyDataInServer } from "juicer-shared";
import type { ReactNode } from "react";
import type { Refetch } from "@/shared/api/refetch";
import { myDataInServerQueryOptions } from "../api/queries";

type Props = {
	serverId: string;
	children: (data: MyDataInServer, refetch: Refetch) => ReactNode;
};

export function MemberProfileFetch({ serverId, children }: Props) {
	const { data, refetch } = useSuspenseQuery(
		myDataInServerQueryOptions(serverId),
	);
	return children(data, () => refetch({ throwOnError: true }));
}
