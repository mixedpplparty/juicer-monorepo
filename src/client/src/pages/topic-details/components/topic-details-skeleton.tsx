import { Skeleton } from "@mixedpplparty/juicer-m3/skeleton";
import { SkeletonRows } from "@/pages/server-overview/components/loading-skeletons";
import { loadingSkeletonStyles } from "@/pages/server-overview/components/loading-skeletons.styles";

export function TopicDetailsSkeleton() {
	return (
		<div
			role="status"
			aria-label="주제 상세 불러오는 중"
			css={loadingSkeletonStyles.page}
		>
			{[0, 1, 2].map((field) => (
				<div key={field} css={loadingSkeletonStyles.field}>
					<Skeleton css={loadingSkeletonStyles.shortLine} />
					<Skeleton css={loadingSkeletonStyles.mediumLine} />
				</div>
			))}
			<SkeletonRows count={3} />
		</div>
	);
}
