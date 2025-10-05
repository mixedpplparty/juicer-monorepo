import type { CSSProperties } from "react";
import { Chip } from "./Chip";
import { _8pxCircle } from "./Circle";
import { Spinner } from "./Spinner";

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
	isLoading,
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
	isLoading?: boolean;
}) => {
	return (
		<Chip
			css={{
				display: "flex",
				flexDirection: "row",
				gap: "4px",
				alignItems: "center",
				cursor: isLoading ? "not-allowed" : "",
				...css,
			}}
			draggable={draggable}
			id={id}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onClick={onClick}
			variant={isLoading ? "loading" : variant}
		>
			{isLoading ? (
				<Spinner
					css={{
						width: "16px",
						height: "16px",
						border: "3px solid rgba(255, 255, 255, 0.5)",
						borderTopColor: "rgba(255, 255, 255, 1)",
					}}
				/>
			) : (
				<_8pxCircle
					css={{
						backgroundColor: color,
					}}
				/>
			)}
			{name}
		</Chip>
	);
};
