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
	variant,
}: {
	name: string;
	color: `#${string}`;
	draggable?: boolean;
	onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
	onDragEnd?: (e: React.DragEvent<HTMLElement>) => void;
	onClick?: (e: React.MouseEvent<HTMLElement>) => void;
	id?: string;
	css?: CSSProperties;
	variant?: "primary" | "unclickable";
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
			variant={variant}
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
