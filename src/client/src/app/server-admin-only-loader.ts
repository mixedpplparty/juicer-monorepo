import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { serverQueryOptions } from "@/features/server/api/queries";
import { queryClient } from "./query-client";

export default async function serverAdminOnlyLoader({
	params,
}: LoaderFunctionArgs) {
	const serverId = params.serverId;

	if (!serverId) {
		throw redirect("/servers");
	}

	const serverData = await queryClient.ensureQueryData(
		serverQueryOptions(serverId),
	);

	if (!serverData.admin) {
		throw redirect(`/servers/${serverId}/no-admin`);
	}

	return null;
}
