import type { ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { ModalPortal } from "./ModalPortal";

// Guard for irreversible actions (delete game / category / role category).
// Calm and explicit, not playful — reassurance wins at high-stakes moments.
export const ConfirmModal = ({
	title,
	description,
	confirmLabel = "삭제",
	cancelLabel = "취소",
	onConfirm,
	onClose,
	loading = false,
}: {
	title: string;
	description?: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onClose: () => void;
	loading?: boolean;
}) => {
	return (
		<ModalPortal>
			<Modal title={title} onClose={onClose}>
				<div css={{ display: "flex", flexDirection: "column", gap: "16px" }}>
					{description && (
						<div css={{ color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.5 }}>
							{description}
						</div>
					)}
					<div
						css={{
							display: "flex",
							flexWrap: "wrap",
							gap: "8px",
							justifyContent: "flex-end",
						}}
					>
						<Button
							type="button"
							css={{ background: "rgba(255, 255, 255, 0.1)" }}
							onClick={onClose}
							disabled={loading}
						>
							{cancelLabel}
						</Button>
						<Button
							type="button"
							css={{
								background: "#ED5555",
								color: "#fff",
								...(loading && { opacity: 0.5, cursor: "not-allowed" }),
							}}
							onClick={loading ? undefined : onConfirm}
							disabled={loading}
							loading={loading}
						>
							{loading ? "삭제 중..." : confirmLabel}
						</Button>
					</div>
				</div>
			</Modal>
		</ModalPortal>
	);
};
