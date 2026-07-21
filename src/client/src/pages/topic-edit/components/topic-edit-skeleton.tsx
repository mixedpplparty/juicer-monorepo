import { Skeleton } from "@mixedpplparty/juicer-m3/skeleton";
import { SkeletonRows } from "@/pages/server-overview/components/loading-skeletons";
import { loadingSkeletonStyles } from "@/pages/server-overview/components/loading-skeletons.styles";

export function TopicEditSkeleton() {
	return (
		<div
			role="status"
			aria-label="주제 편집 화면 불러오는 중"
			css={loadingSkeletonStyles.page}
		>
			<Skeleton css={loadingSkeletonStyles.input} />
			<Skeleton css={loadingSkeletonStyles.input} />
			<SkeletonRows count={3} />
			<SkeletonRows count={3} />
		</div>
	);
}
