import CloseIcon from "@mui/icons-material/Close";
import { useEffect } from "react";
import { InlineButton } from "./Button";
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

	// Escape closes the dialog — standard affordance the icon-only close lacked.
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [onClose]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click closes; Escape also closes via the keydown listener above
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			css={{
				width: "100vw",
				height: "100vh",
				backgroundColor: "rgba(0, 0, 0, 0.75)",
				position: "fixed",
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
					<InlineButton
						type="button"
						aria-label="닫기"
						onClick={onClose}
						css={{ width: "18px", height: "18px" }}
					>
						<CloseIcon css={{ width: "18px", height: "18px" }} />
					</InlineButton>
				</div>
				{children}
			</Card>
		</div>
	);
};
