import type { ReactNode } from "react";
import { useOutletContext, useSearchParams } from "react-router";
import type { ServerDetailsOutletContext } from "@/features/server/model/server-details-context";

export type ServerDetailsPageProps = Record<never, never>;
function useServerDetailsPageModel() {
	const { serverId, serverData, refetchServer } =
		useOutletContext<ServerDetailsOutletContext>();
	const [searchParams, setSearchParams] = useSearchParams();
	const searchQuery = searchParams.get("query") ?? "";
	const normalizedSearchQuery = searchQuery.trim();
	const handleSearchQueryChange = (query: string) => {
		setSearchParams(
			(currentSearchParams) => {
				const nextSearchParams = new URLSearchParams(currentSearchParams);
				if (query) {
					nextSearchParams.set("query", query);
				} else {
					nextSearchParams.delete("query");
				}
				return nextSearchParams;
			},
			{ replace: true },
		);
	};

	return {
		refetchServer,
		serverId,
		serverData,
		searchQuery,
		normalizedSearchQuery,
		handleSearchQueryChange,
	};
}
export type ServerDetailsPageViewModel = ReturnType<
	typeof useServerDetailsPageModel
>;
export function ServerDetailsPagePresenter({
	children,
}: ServerDetailsPageProps & {
	children: (model: ServerDetailsPageViewModel) => ReactNode;
}) {
	const model = useServerDetailsPageModel();
	return children(model);
}
