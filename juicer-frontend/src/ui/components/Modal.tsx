import CloseIcon from "@mui/icons-material/Close";
import { Button } from "./Button";
import { Card, ResponsiveCard } from "./Card";
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
				backgroundColor: "rgba(0, 0, 0, 0.5)",
				position: "absolute",
				zIndex: 3,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
			}}
			onClick={handleBackgroundClick}
		>
			<Card css={{ display: "flex", flexDirection: "column", minWidth: "50%" }}>
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
			</Card>
		</div>
	);
};
