import type { CSSProperties } from "react";
import { Chip } from "./Chip";
import { _8pxCircle } from "./Circle";

export const RoleChip = ({
	name,
	color,
	draggable,
	onDragStart,
	onDragEnd,
	id,
	onClick,
	css,
}: {
	name: string;
	color: `#${string}`;
	draggable?: boolean;
	onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
	onDragEnd?: (e: React.DragEvent<HTMLElement>) => void;
	onClick?: (e: React.MouseEvent<HTMLElement>) => void;
	id?: string;
	css?: CSSProperties;
}) => {
	return (
		<Chip
			css={{
				display: "flex",
				flexDirection: "row",
				gap: "4px",
				alignItems: "center",
				...css,
			}}
			draggable={draggable}
			id={id}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onClick={onClick}
		>
			<_8pxCircle
				css={{
					backgroundColor: color,
				}}
			/>
			{name}
		</Chip>
	);
};
