import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { Select } from "@mixedpplparty/juicer-m3/select";
import { Switch } from "@mixedpplparty/juicer-m3/switch";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { TextField } from "@mixedpplparty/juicer-m3/text-field";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { roleSettingsDialogStyles } from "./role-settings-dialog.styles";

export interface RoleSettingsValue {
	id: string;
	name: string;
	color: string;
	roleCategoryId: number | null;
	selfAssignable: boolean;
	description: string | null;
}

export interface RoleSettingsCategory {
	id: number;
	name: string;
}

export interface RoleSettingsDialogProps {
	role: RoleSettingsValue | null;
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
	const [roleCategoryValue, setRoleCategoryValue] = useState("unassigned");
	const [description, setDescription] = useState("");
	const [selfAssignable, setSelfAssignable] = useState(false);
	const categoryItems = useMemo(
		() => [
			{ value: "unassigned", label: "분류 없음" },
			...categories.map((category) => ({
				value: String(category.id),
				label: category.name,
			})),
		],
		[categories],
	);

	useEffect(() => {
		if (role) {
			setRoleCategoryValue(
				role.roleCategoryId === null
					? "unassigned"
					: String(role.roleCategoryId),
			);
			setDescription(role.description ?? "");
			setSelfAssignable(role.selfAssignable);
		}
	}, [role]);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!role || pending) {
			return;
		}
		onSubmit({
			roleCategoryId:
				roleCategoryValue === "unassigned" ? null : Number(roleCategoryValue),
			selfAssignable,
			description: description.trim() || null,
		});
	};

	return (
		<Dialog.Root
			open={role !== null}
			onOpenChange={(open) => !pending && onOpenChange(open)}
		>
			<Dialog.Popup scrollable>
				<form css={roleSettingsDialogStyles.form} onSubmit={handleSubmit}>
					<Dialog.Title>역할 설정</Dialog.Title>
					<Dialog.Content css={roleSettingsDialogStyles.fields}>
						<div css={roleSettingsDialogStyles.role}>
							<RoleIndicator
								roleName={role?.name ?? ""}
								color={role?.color ?? "#ffffff"}
								typeRole="title"
								size="medium"
							/>
						</div>
						<Select.Root
							css={roleSettingsDialogStyles.fullWidth}
							value={roleCategoryValue}
							items={categoryItems}
							disabled={pending}
							variant="filled"
							onValueChange={(value) => value && setRoleCategoryValue(value)}
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
						</Select.Root>
						<TextField
							label="역할 설명 (선택)"
							variant="filled"
							disabled={pending}
							value={description}
							css={roleSettingsDialogStyles.fullWidth}
							onChange={(event) => setDescription(event.currentTarget.value)}
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
							<Switch
								checked={selfAssignable}
								disabled={pending}
								aria-label="멤버가 직접 역할을 선택할 수 있음"
								onCheckedChange={setSelfAssignable}
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
