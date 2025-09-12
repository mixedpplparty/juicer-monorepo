import { createContext, useContext, useRef, useState } from "react";
import { Toast } from "../ui/components/Toast";

export const ToastContext = createContext<{
	showToast: (message: string) => void;
}>({
	showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
	const [message, setMessage] = useState<string | null>(null);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = (message: string) => {
		if (timeout.current) {
			clearTimeout(timeout.current);
		}
		setMessage(message);
		setIsOpen(true);
		timeout.current = setTimeout(() => {
			setIsOpen(false);
		}, 3000);
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{isOpen && <Toast>{message}</Toast>}
		</ToastContext.Provider>
	);
};

export default ToastProvider;
