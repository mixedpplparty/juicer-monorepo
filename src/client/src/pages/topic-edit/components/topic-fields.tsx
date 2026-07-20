import { Select } from "@mixedpplparty/juicer-m3/select";
import { TextField } from "@mixedpplparty/juicer-m3/text-field";
import { topicEditPageStyles } from "./topic-edit-content.styles";

interface TopicCategoryItem {
	label: string;
	value: string;
}

interface TopicFieldsProps {
	name: string;
	description: string;
	categoryId: number | null;
	categoryItems: TopicCategoryItem[];
	disabled: boolean;
	onNameChange: (name: string) => void;
	onDescriptionChange: (description: string) => void;
	onCategoryIdChange: (categoryId: number | null) => void;
}

export function TopicFields({
	name,
	description,
	categoryId,
	categoryItems,
	disabled,
	onNameChange,
	onDescriptionChange,
	onCategoryIdChange,
}: TopicFieldsProps) {
	return (
		<div css={topicEditPageStyles.fields}>
			<TextField
				label="주제명"
				variant="filled"
				required
				disabled={disabled}
				value={name}
				onChange={(event) => onNameChange(event.currentTarget.value)}
			/>
			<TextField
				label="설명 (선택)"
				variant="filled"
				disabled={disabled}
				value={description}
				onChange={(event) => onDescriptionChange(event.currentTarget.value)}
			/>
			<Select.Root
				items={categoryItems}
				value={categoryId === null ? "none" : String(categoryId)}
				disabled={disabled}
				onValueChange={(value) =>
					onCategoryIdChange(value && value !== "none" ? Number(value) : null)
				}
				css={topicEditPageStyles.fullWidth}
			>
				<Select.Label>카테고리 (선택)</Select.Label>
				<Select.Trigger css={topicEditPageStyles.categoryField}>
					<Select.Value placeholder="카테고리 선택" />
					<Select.Icon />
				</Select.Trigger>
				<Select.Popup>
					<Select.List>
						{categoryItems.map((category) => (
							<Select.Item key={category.value} value={category.value}>
								<Select.ItemIndicator />
								<Select.ItemText>{category.label}</Select.ItemText>
							</Select.Item>
						))}
					</Select.List>
				</Select.Popup>
			</Select.Root>
		</div>
	);
}

export default TopicFields;
