import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { DeleteIcon } from "@mixedpplparty/juicer-m3/icons/delete";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { ReactNode } from "react";
import { topicEditPageStyles } from "./topic-edit-content.styles";

interface TopicAssociationListItem {
	id: string;
	headline: ReactNode;
}

interface TopicAssociationListProps {
	title: string;
	addLabel: string;
	items: TopicAssociationListItem[];
	disabled: boolean;
	onAdd: () => void;
	onRemove: (id: string) => void;
}

export function TopicAssociationList({
	title,
	addLabel,
	items,
	disabled,
	onAdd,
	onRemove,
}: TopicAssociationListProps) {
	return (
		<section css={topicEditPageStyles.section}>
			<Text
				as="h2"
				typeRole="label"
				size="medium"
				css={topicEditPageStyles.sectionTitle}
			>
				{title}
			</Text>
			<List
				container="transparent"
				aria-label={`${title} 목록`}
				css={topicEditPageStyles.list}
			>
				{items.map((item) => (
					<ListItem
						key={item.id}
						css={topicEditPageStyles.listItem}
						headline={item.headline}
						trailing={
							<IconButton
								type="button"
								aria-label={`${title}에서 삭제`}
								disabled={disabled}
								onClick={() => onRemove(item.id)}
							>
								<DeleteIcon />
							</IconButton>
						}
					/>
				))}
				<ListItem
					css={[topicEditPageStyles.listItem, topicEditPageStyles.addItem]}
					render={
						<button
							type="button"
							disabled={disabled}
							onClick={disabled ? undefined : onAdd}
						/>
					}
					leading={<AddIcon />}
					headline={addLabel}
				/>
			</List>
		</section>
	);
}

export default TopicAssociationList;
