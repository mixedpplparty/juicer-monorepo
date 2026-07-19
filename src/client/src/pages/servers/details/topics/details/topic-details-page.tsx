import { Suspense } from "react";
import TopicDetailsContent from "./components/topic-details-content";
import { TopicDetailsSkeleton } from "./components/topic-details-skeleton";

export function TopicDetailsPage() {
	return (
		<Suspense fallback={<TopicDetailsSkeleton />}>
			<TopicDetailsContent />
		</Suspense>
	);
}

export default TopicDetailsPage;
