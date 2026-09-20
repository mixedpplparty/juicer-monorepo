import { Fab, FabMenu } from "@mixedpplparty/juicer-m3/fab";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { SettingsIcon } from "@mixedpplparty/juicer-m3/icons/settings";
import { Link } from "react-router";
import type { AdminFabMenuViewModel } from "./admin-fab-menu.presenter";
import { adminFabMenuStyles } from "./admin-fab-menu.styles";
export function AdminFabMenuView({
	onAddTopic,
	isOpen,
	setIsOpen,
	menuId,
	rootRef,
	triggerRef,
	runAction,
}: AdminFabMenuViewModel) {
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
					nativeButton={false}
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
