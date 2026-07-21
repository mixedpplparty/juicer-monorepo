import { Chip } from "@mixedpplparty/juicer-m3/chip";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { DragEvent, ReactNode } from "react";
import type { RoleSettingsValue } from "../model/role-settings-form";
import { roleDropZoneStyles } from "./role-drop-zone.styles";

interface RoleDropZoneProps {
	name: string;
	roles: RoleSettingsValue[];
	categoryKey: string;
	dragOverCategory: string | null;
	disabled: boolean;
	deleteAction?: ReactNode;
	onRoleClick: (role: RoleSettingsValue) => void;
	onDragStart: (roleId: string) => void;
	onDragOverCategory: (categoryKey: string) => void;
	onDrop: (event: DragEvent<HTMLElement>) => void;
}

export function RoleDropZone({
	name,
	roles,
	categoryKey,
	dragOverCategory,
	disabled,
	deleteAction,
	onRoleClick,
	onDragStart,
	onDragOverCategory,
	onDrop,
}: RoleDropZoneProps) {
	return (
		<section
			aria-labelledby={`role-category-${categoryKey}`}
			css={roleDropZoneStyles.root}
			data-drag-over={dragOverCategory === categoryKey}
			onDragEnter={() => !disabled && onDragOverCategory(categoryKey)}
			onDragOver={(event) => {
				if (!disabled) {
					event.preventDefault();
				}
			}}
			onDragLeave={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node)) {
					onDragOverCategory("");
				}
			}}
			onDrop={onDrop}
		>
			<div css={roleDropZoneStyles.header}>
				<Text
					id={`role-category-${categoryKey}`}
					as="h3"
					typeRole="title"
					size="medium"
					css={roleDropZoneStyles.name}
				>
					{name}
				</Text>
				{deleteAction}
			</div>
			<div css={roleDropZoneStyles.chips}>
				{roles.length > 0 ? (
					roles.map((role) => (
						<Chip
							key={role.id}
							type="button"
							variant="assist"
							draggable={!disabled}
							disabled={disabled}
							css={roleDropZoneStyles.chip}
							onDragStart={(event) => {
								event.dataTransfer.setData("text/plain", role.id);
								event.dataTransfer.effectAllowed = "move";
								onDragStart(role.id);
							}}
							onDragEnd={() => onDragOverCategory("")}
							onClick={() => onRoleClick(role)}
						>
							<RoleIndicator
								roleName={role.name}
								color={role.color}
								typeRole="label"
								size="large"
							/>
						</Chip>
					))
				) : (
					<Text
						as="p"
						typeRole="body"
						size="small"
						css={roleDropZoneStyles.empty}
					>
						역할을 여기로 끌어다 놓으세요.
					</Text>
				)}
			</div>
		</section>
	);
}

export default RoleDropZone;
