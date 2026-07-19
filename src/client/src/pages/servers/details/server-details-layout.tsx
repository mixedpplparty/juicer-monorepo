import { Suspense } from "react";
import { useLocation, useMatches } from "react-router";
import {
	ServerDetailsLayoutSkeleton,
	type ServerRouteSkeletonKind,
} from "./components/loading-skeletons";
import ServerDetailsLayoutContent, {
	type ServerPageHandle,
} from "./components/server-details-layout-content";
import { ServerSettingsSkeleton } from "./settings/components/server-settings-skeleton";
import { TopicDetailsSkeleton } from "./topics/details/components/topic-details-skeleton";
import { TopicEditSkeleton } from "./topics/edit/components/topic-edit-skeleton";

export function ServerDetailsLayout() {
	const location = useLocation();
	const matches = useMatches();
	const activeHandle = matches.at(-1)?.handle as ServerPageHandle | undefined;
	const skeletonKind: ServerRouteSkeletonKind =
		activeHandle?.serverContentSkeleton ?? "overview";
	const contentSkeleton =
		skeletonKind === "settings" ? (
			<ServerSettingsSkeleton />
		) : skeletonKind === "topic" ? (
			<TopicDetailsSkeleton />
		) : skeletonKind === "topic-edit" ? (
			<TopicEditSkeleton />
		) : undefined;

	return (
		<Suspense
			key={location.pathname}
			fallback={
				<ServerDetailsLayoutSkeleton
					kind={skeletonKind}
					content={contentSkeleton}
				/>
			}
		>
			<ServerDetailsLayoutContent />
		</Suspense>
	);
}

export default ServerDetailsLayout;
