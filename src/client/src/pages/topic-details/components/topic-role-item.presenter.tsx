import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { useQueryClient } from "@tanstack/react-query";
import type { TopicDetailsRole } from "juicer-shared";
import type { ReactNode } from "react";
import { invalidateServerRoleState } from "@/shared/api/query-invalidation";
import { useLoading } from "@/shared/async/use-loading";
import { setRoleAssignment } from "../api/mutations";
export interface TopicRoleItemProps {
	serverId: string;
	role: TopicDetailsRole;
}

function useTopicRoleItemModel({ serverId, role }: TopicRoleItemProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const [changeRoleAssignmentPending, withChangeRoleAssignment] = useLoading();

	async function changeRoleAssignment(assigned: boolean) {
		if (changeRoleAssignmentPending) return;
		await withChangeRoleAssignment(async () => {
			try {
				await setRoleAssignment({ serverId, roleId: role.id, assigned });

				await invalidateServerRoleState(queryClient, serverId);
				enqueue(
					assigned
						? `${role.name} 역할을 추가했습니다.`
						: `${role.name} 역할을 제거했습니다.`,
				);
			} catch (error) {
				enqueue(
					error instanceof Error
						? error.message
						: "역할을 변경하지 못했습니다.",
					{ title: "오류" },
				);
			}
		});
	}
	const disabled = changeRoleAssignmentPending || !role.selfAssignable;
	return {
		role,
		changeRoleAssignment,
		disabled,
	};
}
export type TopicRoleItemViewModel = ReturnType<typeof useTopicRoleItemModel>;
export function TopicRoleItemPresenter({
	children,
	...props
}: TopicRoleItemProps & {
	children: (model: TopicRoleItemViewModel) => ReactNode;
}) {
	const model = useTopicRoleItemModel(props);
	return children(model);
}
