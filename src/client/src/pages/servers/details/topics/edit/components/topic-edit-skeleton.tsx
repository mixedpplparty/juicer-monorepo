import { Skeleton } from "juicer-m3/skeleton";
import { SkeletonRows } from "../../../components/loading-skeletons";
import { loadingSkeletonStyles } from "../../../components/loading-skeletons.styles";

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
