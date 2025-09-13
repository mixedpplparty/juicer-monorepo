import CloseIcon from "@mui/icons-material/Close";
import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";
import type { ToastObject, ToastProps } from "../types/types";
import { Toast } from "../ui/components/Toast";
import { ToastContainer } from "../ui/components/ToastContainer";
export const ToastContext = createContext<{
	showToast: (message: string, type: ToastProps["type"]) => void;
}>({
	showToast: () => {},
});

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
	const [toasts, setToasts] = useState<ToastObject[]>([]);
	const removeToast = useCallback((idx: number) => {
		setToasts((prev) => prev.filter((toast) => toast.idx !== idx));
	}, []);

	const showToast = (message: string, type: ToastProps["type"]) => {
		const idx = Date.now(); //use instead of toasts.length for reliability
		setToasts((prev) => [...prev, { message, type, idx }]);
		setTimeout(() => {
			removeToast(idx);
		}, 3000);
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<ToastContainer>
				{toasts.map((toast) => (
					<Toast key={toast.idx} type={toast.type}>
						{toast.message}
						<CloseIcon
							onClick={() => removeToast(toast.idx)}
							css={{ cursor: "pointer", width: "16px", height: "16px" }}
						/>
					</Toast>
				))}
			</ToastContainer>
		</ToastContext.Provider>
	);
};

export default ToastProvider;
