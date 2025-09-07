import { createPortal } from "react-dom";

export const ModalPortal = ({ children }: { children: React.ReactNode }) => {
	return createPortal(children, document.getElementById("modal-root")!);
};
