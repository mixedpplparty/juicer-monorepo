import { useSuspenseQuery } from "@tanstack/react-query";
import type { MyInfo } from "juicer-shared";
import type { ReactNode } from "react";
import type { Refetch } from "@/shared/api/refetch";
import { myInfoQueryOptions } from "../api/queries";

type Props = {
	children: (data: MyInfo, refetch: Refetch) => ReactNode;
};

export function CurrentUserFetch({ children }: Props) {
	const { data, refetch } = useSuspenseQuery(myInfoQueryOptions());
	return children(data, () => refetch({ throwOnError: true }));
}
