import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { Select } from "@mixedpplparty/juicer-m3/select";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { RoleSettingsRole } from "juicer-shared";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { FormInput } from "@/shared/forms/form-input";
import { FormSelect } from "@/shared/forms/form-select";
import { FormSwitch } from "@/shared/forms/form-switch";
import {
	getRoleSettingsDefaultValues,
	type RoleSettingsFormValues,
	toRoleSettingsSubmission,
	unassignedRoleCategoryValue,
} from "../model/role-settings-form";
import { roleSettingsDialogStyles } from "./role-settings-dialog.styles";

export interface RoleSettingsCategory {
	id: number;
	name: string;
}

export interface RoleSettingsDialogProps {
	role: RoleSettingsRole;
	categories: RoleSettingsCategory[];
	pending?: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (value: {
		roleCategoryId: number | null;
		selfAssignable: boolean;
		description: string | null;
	}) => void;
}

export function RoleSettingsDialog({
	role,
	categories,
	pending = false,
	onOpenChange,
	onSubmit,
}: RoleSettingsDialogProps) {
	const { control, handleSubmit } = useForm<RoleSettingsFormValues>({
		defaultValues: getRoleSettingsDefaultValues(role),
	});
	const categoryItems = useMemo(
		() => [
			{ value: unassignedRoleCategoryValue, label: "분류 없음" },
			...categories.map((category) => ({
				value: String(category.id),
				label: category.name,
			})),
		],
		[categories],
	);

	const submit = handleSubmit((values) => {
		if (!pending) {
			onSubmit(toRoleSettingsSubmission(values));
		}
	});

	return (
		<Dialog.Root open onOpenChange={(open) => !pending && onOpenChange(open)}>
			<Dialog.Popup scrollable>
				<form css={roleSettingsDialogStyles.form} onSubmit={submit}>
					<Dialog.Title>역할 설정</Dialog.Title>
					<Dialog.Content css={roleSettingsDialogStyles.fields}>
						<div css={roleSettingsDialogStyles.role}>
							<RoleIndicator
								roleName={role.name}
								color={role.color}
								typeRole="title"
								size="medium"
							/>
						</div>
						<FormSelect
							control={control}
							name="roleCategoryId"
							css={roleSettingsDialogStyles.fullWidth}
							items={categoryItems}
							disabled={pending}
							variant="filled"
						>
							<Select.Label>역할 분류</Select.Label>
							<Select.Trigger>
								<Select.Value placeholder="역할 분류 선택" />
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
							<Select.Description>
								분류는 멤버 프로필에서 관련 역할을 한 그룹으로 보여줍니다.
							</Select.Description>
						</FormSelect>
						<FormInput
							control={control}
							name="description"
							label="역할 설명 (선택)"
							variant="filled"
							disabled={pending}
							css={roleSettingsDialogStyles.fullWidth}
						/>
						<div css={roleSettingsDialogStyles.switchRow}>
							<span css={roleSettingsDialogStyles.switchText}>
								<Text typeRole="body" size="large">
									멤버가 직접 역할을 선택할 수 있음
								</Text>
								<Text
									typeRole="body"
									size="small"
									css={roleSettingsDialogStyles.helper}
								>
									끄면 관리자만 이 역할을 부여할 수 있습니다.
								</Text>
							</span>
							<FormSwitch
								control={control}
								name="selfAssignable"
								disabled={pending}
								aria-label="멤버가 직접 역할을 선택할 수 있음"
							/>
						</div>
					</Dialog.Content>
					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={pending}
							onClick={() => onOpenChange(false)}
						>
							취소
						</Button>
						<Button type="submit" disabled={pending}>
							{pending ? "저장 중…" : "저장"}
						</Button>
					</Dialog.Actions>
				</form>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

export default RoleSettingsDialog;
