import { Chip } from "./Chip";
import { _8pxCircle } from "./Circle";

export const RoleChip = ({
	name,
	color,
	draggable,
	onDragStart,
	onDragEnd,
	onDragEnter,
	onDragLeave,
	onDragOver,
	id,
}: {
	name: string;
	color: number[];
	draggable?: boolean;
	onDragStart?: () => void;
	onDragEnd?: () => void;
	onDragEnter?: () => void;
	onDragLeave?: () => void;
	onDragOver?: () => void;
	id?: string;
}) => {
	return (
		<Chip
			css={{
				display: "flex",
				flexDirection: "row",
				gap: "4px",
				alignItems: "center",
			}}
			draggable={draggable}
			id={id}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onDragEnter={onDragEnter}
			onDragLeave={onDragLeave}
			onDragOver={onDragOver}
		>
			<_8pxCircle
				css={{
					backgroundColor: `rgb(${color.join(",") || "255, 255, 255"})`,
				}}
			/>
			{name}
		</Chip>
	);
};
