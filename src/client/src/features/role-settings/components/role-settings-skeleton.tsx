import { Skeleton } from "@mixedpplparty/juicer-m3/skeleton";
import { roleSettingsSectionStyles } from "./role-settings-section.styles";
import { roleSettingsSkeletonStyles } from "./role-settings-skeleton.styles";

const skeletonGroups = ["unassigned", "verification", "category"];

export function RoleSettingsSkeleton() {
	return (
		<div
			role="status"
			aria-label="역할 설정 불러오는 중"
			css={roleSettingsSkeletonStyles.root}
		>
			<div css={roleSettingsSectionStyles.groups}>
				{skeletonGroups.map((group) => (
					<div key={group} css={roleSettingsSkeletonStyles.group}>
						<Skeleton css={roleSettingsSkeletonStyles.groupName} />
						<div css={roleSettingsSkeletonStyles.chips}>
							<Skeleton css={roleSettingsSkeletonStyles.chip} />
							<Skeleton
								css={[
									roleSettingsSkeletonStyles.chip,
									roleSettingsSkeletonStyles.shortChip,
								]}
							/>
						</div>
					</div>
				))}
			</div>
			<div css={roleSettingsSkeletonStyles.action}>
				<Skeleton css={roleSettingsSkeletonStyles.actionIcon} />
				<Skeleton css={roleSettingsSkeletonStyles.actionLabel} />
			</div>
		</div>
	);
}

export default RoleSettingsSkeleton;
