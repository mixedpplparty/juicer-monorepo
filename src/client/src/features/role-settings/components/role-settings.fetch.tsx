import { useSuspenseQuery } from "@tanstack/react-query";
import type { RoleSettingsView } from "juicer-shared";
import type { ReactNode } from "react";
import type { Refetch } from "@/shared/api/refetch";
import { roleSettingsQueryOptions } from "../api/queries";

type Props = {
	serverId: string;
	children: (data: RoleSettingsView, refetch: Refetch) => ReactNode;
};

export function RoleSettingsFetch({ serverId, children }: Props) {
	const { data, refetch } = useSuspenseQuery(
		roleSettingsQueryOptions(serverId),
	);
	return children(data, () => refetch({ throwOnError: true }));
}
