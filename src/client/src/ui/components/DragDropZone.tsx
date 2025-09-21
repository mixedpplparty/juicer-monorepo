import type { CSSProperties } from "react";
import { Card } from "./Card";

export const DragDropZone = ({
	children,
	css,
	id,
	onDragOver,
	onDragEnter,
	onDragLeave,
	onDrop,
}: {
	children: React.ReactNode;
	css?: CSSProperties;
	id?: number | string;
	onDragOver?: () => void;
	onDragEnter?: () => void;
	onDragLeave?: () => void;
	onDrop?: () => void;
}) => {
	return (
		<Card
			css={{ border: "1px dashed rgba(255, 255, 255, 0.33)", flex: 1, ...css }}
			id={id?.toString()}
			onDragOver={onDragOver}
			onDragEnter={onDragEnter}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
		>
			{children}
		</Card>
	);
};
