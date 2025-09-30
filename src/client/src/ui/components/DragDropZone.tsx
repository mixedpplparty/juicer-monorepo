import type { CSSProperties } from "react";
import { Card } from "./Card";

export const DragDropZone = ({
	children,
	css,
	id,
	onDragEnter,
	onDragLeave,
	onDrop,
}: {
	children: React.ReactNode;
	css?: CSSProperties;
	id?: number | string;
	onDragEnter?: (e: React.DragEvent<HTMLElement>) => void;
	onDragLeave?: (e: React.DragEvent<HTMLElement>) => void;
	onDrop?: (e: React.DragEvent<HTMLElement>) => void;
}) => {
	return (
		<Card
			css={{
				border: "1px dashed rgba(255, 255, 255, 0.33)",
				flex: 1,
				display: "flex",
				flexDirection: "row",
				gap: "4px",
				flexWrap: "wrap",
				...css,
			}}
			id={id?.toString()}
			onDragOver={(e: React.DragEvent<HTMLElement>) => {
				e.preventDefault(); //allows drop
			}}
			onDragEnter={onDragEnter}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
		>
			{children}
		</Card>
	);
};
