import { Suspense } from "react";
import ServerListEmptyState from "./components/server-list-empty-state";

export function ServerListPage() {
	return (
		<Suspense fallback={null}>
			<ServerListEmptyState />
		</Suspense>
	);
}

export default ServerListPage;
