import { createContext, useContext, useRef, useState } from "react";
import type { ToastProps } from "../types/types";
import { Toast } from "../ui/components/Toast";

export const ToastContext = createContext<{
	showToast: (message: string, type: ToastProps["type"]) => void;
}>({
	showToast: () => {},
});

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
	const [message, setMessage] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [type, setType] = useState<ToastProps["type"]>("info");

	const showToast = (message: string, type: ToastProps["type"]) => {
		if (timeout.current) {
			clearTimeout(timeout.current);
		}
		setMessage(message);
		setIsOpen(true);
		setType(type);
		timeout.current = setTimeout(() => {
			setIsOpen(false);
		}, 3000);
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{isOpen && <Toast type={type}>{message}</Toast>}
		</ToastContext.Provider>
	);
};

export default ToastProvider;
