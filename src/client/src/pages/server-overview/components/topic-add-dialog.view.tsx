import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { Select } from "@mixedpplparty/juicer-m3/select";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { FormInput } from "@/shared/forms/form-input";
import { FormSelect } from "@/shared/forms/form-select";
import type { TopicAddDialogViewModel } from "./topic-add-dialog.presenter";
import { topicAddDialogStyles } from "./topic-add-dialog.styles";
export function TopicAddDialogView({
	open,
	form,
	isValid,
	categories,
	addTopicPending,
	addTopicError,
	requestClose,
	submit,
	handleOpenChange,
}: TopicAddDialogViewModel) {
	return (
		<Dialog.Root open={open} onOpenChange={handleOpenChange}>
			<Dialog.Popup>
				<Dialog.Title>주제 추가</Dialog.Title>
				<form css={topicAddDialogStyles.form} onSubmit={submit}>
					<Dialog.Content css={topicAddDialogStyles.fields}>
						<FormInput
							control={form.control}
							name="name"
							label="이름"
							required
							disabled={addTopicPending}
						/>
						<FormInput
							control={form.control}
							name="description"
							label="설명 (선택)"
							disabled={addTopicPending}
						/>

						<div css={topicAddDialogStyles.categoryField}>
							<FormSelect
								control={form.control}
								name="categoryId"
								items={categories}
								disabled={addTopicPending}
							>
								<Select.Label>카테고리 (선택)</Select.Label>
								<Select.Trigger>
									<Select.Value placeholder="카테고리 선택" />
									<Select.Icon />
								</Select.Trigger>
								<Select.Popup>
									<Select.List>
										{categories.map((category) => (
											<Select.Item key={category.value} value={category.value}>
												<Select.ItemIndicator />
												<Select.ItemText>{category.label}</Select.ItemText>
											</Select.Item>
										))}
									</Select.List>
								</Select.Popup>
							</FormSelect>
						</div>

						{addTopicError && (
							<Text
								as="p"
								typeRole="body"
								size="medium"
								role="alert"
								css={topicAddDialogStyles.error}
							>
								{addTopicError.message}
							</Text>
						)}
					</Dialog.Content>

					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={addTopicPending}
							onClick={requestClose}
						>
							취소
						</Button>
						<Button type="submit" disabled={addTopicPending || !isValid}>
							{addTopicPending ? "추가하는 중..." : "추가하기"}
						</Button>
					</Dialog.Actions>
				</form>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
