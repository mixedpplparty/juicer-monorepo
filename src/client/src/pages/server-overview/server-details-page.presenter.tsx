import { parseAsString, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { useOutletContext } from "react-router";
import type { ServerDetailsOutletContext } from "@/features/server/model/server-details-context";

import { useDebouncedValue } from "./hooks/use-debounced-value";

export type ServerDetailsPageProps = Record<never, never>;
function useServerDetailsPageModel() {
	const { serverId, serverData, refetchServer } =
		useOutletContext<ServerDetailsOutletContext>();
	const [searchText, setSearchText] = useQueryState(
		"query",
		parseAsString.withDefault(""),
	);
	// Keep input and URL responsive; only delay the query sent to TopicsFetch.
	const searchQuery = useDebouncedValue(searchText.trim(), 300);

	return {
		refetchServer,
		serverId,
		serverData,
		searchText,
		searchQuery,
		handleSearchChange: setSearchText,
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
