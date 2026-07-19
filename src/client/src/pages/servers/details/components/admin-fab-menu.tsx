import { AddIcon, Fab, FabMenu, SettingsIcon } from "juicer-m3";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { adminFabMenuStyles } from "./admin-fab-menu.styles";

export interface AdminFabMenuProps {
	onAddTopic?: () => void;
}

export function AdminFabMenu({ onAddTopic }: AdminFabMenuProps) {
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

	return (
		<div ref={rootRef} css={adminFabMenuStyles.root}>
			<FabMenu id={menuId} open={isOpen} css={adminFabMenuStyles.menu}>
				<Fab
					aria-label="주제 추가"
					icon={<AddIcon />}
					label="주제 추가"
					variant="primary-container"
					onClick={() => runAction(onAddTopic)}
				/>
				<Fab
					aria-label="서버 설정"
					icon={<SettingsIcon />}
					label="서버 설정"
					variant="primary-container"
					render={<Link to="settings" />}
					css={{ textDecoration: "none" }}
				/>
			</FabMenu>
			<Fab
				ref={triggerRef}
				aria-label={isOpen ? "관리 메뉴 닫기" : "관리 메뉴 열기"}
				aria-controls={menuId}
				aria-expanded={isOpen}
				variant="primary"
				icon={<SettingsIcon />}
				onClick={() => setIsOpen((open) => !open)}
			/>
		</div>
	);
}

export default AdminFabMenu;
