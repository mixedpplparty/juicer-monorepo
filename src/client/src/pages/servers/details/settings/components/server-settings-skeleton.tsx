import { Skeleton } from "juicer-m3";
import { SkeletonRows } from "../../components/loading-skeletons";
import { loadingSkeletonStyles } from "../../components/loading-skeletons.styles";

export function ServerSettingsSkeleton() {
	return (
		<div
			role="status"
			aria-label="서버 설정 불러오는 중"
			css={loadingSkeletonStyles.page}
		>
			{[0, 1, 2].map((section) => (
				<div key={section} css={loadingSkeletonStyles.settingsSection}>
					<Skeleton css={loadingSkeletonStyles.shortLine} />
					<SkeletonRows count={section === 1 ? 4 : 2} />
				</div>
			))}
		</div>
	);
}
