import { Chip } from "@mixedpplparty/juicer-m3/chip";
import { RoleIndicator } from "@mixedpplparty/juicer-m3/role-indicator";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { RoleDropZoneViewModel } from "./role-drop-zone.presenter";
import { roleDropZoneStyles } from "./role-drop-zone.styles";
export function RoleDropZoneView({
	name,
	roles,
	deleteAction,
	onRoleClick,
	onDragEnd,
	onDrop,
	headingId,
	isDragOver,
	roleItems,
	enterCategory,
	dragOver,
	leaveCategory,
	startRoleDrag,
}: RoleDropZoneViewModel) {
	return (
		<section
			aria-labelledby={headingId}
			css={roleDropZoneStyles.root}
			data-drag-over={isDragOver}
			onDragEnter={enterCategory}
			onDragOver={dragOver}
			onDragLeave={leaveCategory}
			onDrop={onDrop}
		>
			<div css={roleDropZoneStyles.header}>
				<Text
					id={headingId}
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
					roleItems.map(({ role, disabled: roleDisabled }) => {
						return (
							<Chip
								key={role.id}
								type="button"
								variant="assist"
								draggable={!roleDisabled}
								disabled={roleDisabled}
								css={roleDropZoneStyles.chip}
								onDragStart={(event) => startRoleDrag(event, role)}
								onDragEnd={onDragEnd}
								onClick={() => onRoleClick(role)}
							>
								<RoleIndicator
									roleName={role.name}
									color={role.color}
									typeRole="label"
									size="large"
								/>
							</Chip>
						);
					})
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
