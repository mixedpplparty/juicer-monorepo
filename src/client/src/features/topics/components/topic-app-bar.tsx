import type { ReactNode } from "react";
import { ServerPageAppBar } from "@/features/server/components/server-page-app-bar";
export interface TopicAppBarProps {
	serverId: string;
	topicId: number;
	topicName: string;
	serverName: string;
	admin: boolean;
	mode: "topic" | "topic-edit";
	actions?: ReactNode;
}

export function TopicAppBar({
	serverId,
	topicId,
	topicName,
	serverName,
	admin,
	mode,
	actions,
}: TopicAppBarProps) {
	const editing = mode === "topic-edit";

	return (
		<ServerPageAppBar
			title={editing ? "주제 편집" : topicName}
			subtitle={editing ? topicName : `@${serverName}`}
			backTo={
				editing
					? `/servers/${serverId}/topics/${topicId}`
					: `/servers/${serverId}`
			}
			backLabel={editing ? "주제 상세로 돌아가기" : "주제 목록으로 돌아가기"}
			actions={admin && !editing ? actions : undefined}
		/>
	);
}
