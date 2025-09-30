import { Chip } from "./Chip";
import { _8pxCircle } from "./Circle";

export const RoleChip = ({
	name,
	color,
	draggable,
	onDragStart,
	onDragEnd,
	id,
}: {
	name: string;
	color: `#${string}`;
	draggable?: boolean;
	onDragStart?: (e: React.DragEvent<HTMLElement>) => void;
	onDragEnd?: (e: React.DragEvent<HTMLElement>) => void;
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
