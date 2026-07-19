import { Suspense } from "react";
import { ServerOverviewSkeleton } from "./components/loading-skeletons";
import ServerDetailsContent from "./components/server-details-content";

export function ServerDetailsPage() {
	return (
		<Suspense fallback={<ServerOverviewSkeleton />}>
			<ServerDetailsContent />
		</Suspense>
	);
}

export default ServerDetailsPage;
