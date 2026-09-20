import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { TopicSearchResult } from "juicer-shared";
import { Link } from "react-router";
import type { TopicListViewModel } from "./topic-list.presenter";
import { topicListStyles } from "./topic-list.styles";
export function TopicListView({ topics, searchQuery }: TopicListViewModel) {
	if (topics.length === 0) {
		return (
			<Text as="p" typeRole="body" size="medium" css={topicListStyles.status}>
				{searchQuery ? "검색 결과가 없습니다." : "등록된 주제가 없습니다."}
			</Text>
		);
	}
	return (
		<List
			container="transparent"
			aria-label="주제 목록"
			css={topicListStyles.list}
		>
			{topics.map((topic) => (
				<TopicListItem key={topic.gameId} topic={topic} />
			))}
		</List>
	);
}
interface TopicListItemProps {
	topic: TopicSearchResult;
}
function TopicListItem({ topic }: TopicListItemProps) {
	return (
		<ListItem
			css={topicListStyles.item}
			render={<Link to={`topics/${topic.gameId}`} />}
			headline={
				<Text typeRole="title" size="large">
					{topic.name}
				</Text>
			}
			supportingText={
				<span css={topicListStyles.details}>
					<span css={topicListStyles.channels}>
						{topic.channels.length > 0 ? (
							topic.channels.map((channel) => (
								<Text key={channel.id} typeRole="body" size="medium">
									#{channel.name}
								</Text>
							))
						) : (
							<Text
								typeRole="body"
								size="medium"
								css={topicListStyles.emptyAssociation}
							>
								연관 채널 없음
							</Text>
						)}
					</span>
					<span css={topicListStyles.roles}>
						{topic.roles.length > 0 ? (
							topic.roles.map((role) => (
								<RoleIndicator
									key={role.id}
									roleName={role.name}
									color={role.color}
									active={role.assigned}
									typeRole="body"
									size="medium"
								/>
							))
						) : (
							<Text
								typeRole="body"
								size="medium"
								css={topicListStyles.emptyAssociation}
							>
								연관 역할 없음
							</Text>
						)}
					</span>
				</span>
			}
		/>
	);
}
