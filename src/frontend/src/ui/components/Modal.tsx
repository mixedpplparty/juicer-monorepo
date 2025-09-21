import CloseIcon from "@mui/icons-material/Close";
import { Card } from "./Card";
export const Modal = ({
	children,
	title,
	onClose,
}: {
	children: React.ReactNode;
	title: string;
	onClose: () => void;
}) => {
	const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			css={{
				width: "100vw",
				height: "100vh",
				backgroundColor: "rgba(0, 0, 0, 0.75)",
				position: "absolute",
				zIndex: 3,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
			onClick={handleBackgroundClick}
		>
			<Card
				css={{
					display: "flex",
					flexDirection: "column",
					minWidth: "50%",
					border: "1px solid rgba(255, 255, 255, 0.66)",
				}}
			>
				<div
					css={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<h2 css={{ margin: 0 }}>{title}</h2>
					<CloseIcon
						onClick={onClose}
						css={{ cursor: "pointer", width: "18px", height: "18px" }}
					/>
				</div>
				{children}
			</Card>
		</div>
	);
};
