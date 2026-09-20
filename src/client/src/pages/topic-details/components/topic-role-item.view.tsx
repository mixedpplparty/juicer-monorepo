import { CheckboxListItem } from "@mixedpplparty/juicer-m3/list";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { topicDetailsPageStyles } from "../topic-details-page.styles";
import type { TopicRoleItemViewModel } from "./topic-role-item.presenter";
export function TopicRoleItemView({
	role,
	changeRoleAssignment,
	disabled,
}: TopicRoleItemViewModel) {
	return (
		<CheckboxListItem
			checked={role.assigned}
			disabled={disabled}
			css={topicDetailsPageStyles.roleItem}
			headline={
				<RoleIndicator
					roleName={role.name}
					color={role.color}
					typeRole="body"
					size="large"
				/>
			}
			supportingText={role.description || undefined}
			onCheckedChange={(checked) => void changeRoleAssignment(checked)}
		/>
	);
}
