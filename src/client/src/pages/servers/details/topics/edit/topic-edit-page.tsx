import { Suspense } from "react";
import TopicEditContent from "./components/topic-edit-content";
import { TopicEditSkeleton } from "./components/topic-edit-skeleton";

export function TopicEditPage() {
	return (
		<Suspense fallback={<TopicEditSkeleton />}>
			<TopicEditContent />
		</Suspense>
	);
}

export default TopicEditPage;
