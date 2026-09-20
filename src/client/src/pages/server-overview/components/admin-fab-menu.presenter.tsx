import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
export interface AdminFabMenuProps {
	onAddTopic?: () => void;
}

function useAdminFabMenuModel({ onAddTopic }: AdminFabMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const menuId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
				triggerRef.current?.focus();
			}
		};
		const closeOnOutsidePress = (event: PointerEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("keydown", closeOnEscape);
		document.addEventListener("pointerdown", closeOnOutsidePress);

		return () => {
			document.removeEventListener("keydown", closeOnEscape);
			document.removeEventListener("pointerdown", closeOnOutsidePress);
		};
	}, [isOpen]);
	const runAction = (action?: () => void) => {
		setIsOpen(false);
		action?.();
	};
	return {
		onAddTopic,
		isOpen,
		setIsOpen,
		menuId,
		rootRef,
		triggerRef,
		runAction,
	};
}
export type AdminFabMenuViewModel = ReturnType<typeof useAdminFabMenuModel>;
export function AdminFabMenuPresenter({
	children,
	...props
}: AdminFabMenuProps & {
	children: (model: AdminFabMenuViewModel) => ReactNode;
}) {
	const model = useAdminFabMenuModel(props);
	return children(model);
}
