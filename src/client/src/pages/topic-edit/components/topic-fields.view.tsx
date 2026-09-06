import { Select } from "@mixedpplparty/juicer-m3/select";
import type { Control } from "react-hook-form";
import type {
	TopicUpdateFormInput,
	TopicUpdateFormOutput,
} from "@/features/topics/model/topic-form-schema";
import { FormInput } from "@/shared/forms/form-input";
import { FormSelect } from "@/shared/forms/form-select";
import { topicEditPageStyles } from "./topic-edit-content.styles";

interface TopicCategoryItem {
	label: string;
	value: string;
}

interface TopicFieldsProps {
	control: Control<TopicUpdateFormInput, unknown, TopicUpdateFormOutput>;
	categoryItems: TopicCategoryItem[];
	disabled: boolean;
}

export function TopicFields({
	control,
	categoryItems,
	disabled,
}: TopicFieldsProps) {
	return (
		<div css={topicEditPageStyles.fields}>
			<FormInput
				control={control}
				name="name"
				label="주제명"
				variant="filled"
				required
				disabled={disabled}
			/>
			<FormInput
				control={control}
				name="description"
				label="설명 (선택)"
				variant="filled"
				disabled={disabled}
			/>
			<FormSelect
				control={control}
				name="categoryId"
				items={categoryItems}
				disabled={disabled}
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
			</FormSelect>
		</div>
	);
}

export default TopicFields;
