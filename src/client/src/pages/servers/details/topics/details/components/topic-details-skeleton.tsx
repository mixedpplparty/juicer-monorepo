import { Skeleton } from "juicer-m3/skeleton";
import { SkeletonRows } from "../../../components/loading-skeletons";
import { loadingSkeletonStyles } from "../../../components/loading-skeletons.styles";

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
