import { Children, type CSSProperties, useState } from "react";
import { Card } from "./Card";

export const DragDropZone = ({
	children,
	css,
	id,
	emptyLabel,
	onDragEnter,
	onDragLeave,
	onDrop,
}: {
	children: React.ReactNode;
	css?: CSSProperties;
	id?: number | string;
	emptyLabel?: string;
	onDragEnter?: (e: React.DragEvent<HTMLElement>) => void;
	onDragLeave?: (e: React.DragEvent<HTMLElement>) => void;
	onDrop?: (e: React.DragEvent<HTMLElement>) => void;
}) => {
	const [isDragOver, setIsDragOver] = useState(false);
	const isEmpty = Children.count(children) === 0;
	return (
		<Card
			css={{
				// Brighter dashed border (the old 0.33 was barely visible) plus a violet
				// inset glow while a role hovers over it, so the drop target is obvious.
				border: `1px dashed ${isDragOver ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.6)"}`,
				boxShadow: isDragOver
					? "inset 0 0 24px rgba(133, 103, 214, 0.22)"
					: undefined,
				transition: "border-color 0.15s ease-out, box-shadow 0.15s ease-out",
				minHeight: "44px",
				alignItems: "center",
				flex: 1,
				display: "flex",
				flexDirection: "row",
				gap: "4px",
				flexWrap: "wrap",
				"@media (prefers-reduced-motion: reduce)": { transition: "none" },
				...css,
			}}
			id={id?.toString()}
			onDragOver={(e: React.DragEvent<HTMLElement>) => {
				e.preventDefault(); //allows drop
				if (!isDragOver) setIsDragOver(true);
			}}
			onDragEnter={(e) => {
				setIsDragOver(true);
				onDragEnter?.(e);
			}}
			onDragLeave={(e) => {
				setIsDragOver(false);
				onDragLeave?.(e);
			}}
			onDrop={(e) => {
				setIsDragOver(false);
				onDrop?.(e);
			}}
		>
			{isEmpty && emptyLabel ? (
				<span css={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.875rem" }}>
					{emptyLabel}
				</span>
			) : (
				children
			)}
		</Card>
	);
};
