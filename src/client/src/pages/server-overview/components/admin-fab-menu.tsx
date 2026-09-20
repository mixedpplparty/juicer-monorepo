import {
	AdminFabMenuPresenter,
	type AdminFabMenuProps,
} from "./admin-fab-menu.presenter";
import { AdminFabMenuView } from "./admin-fab-menu.view";

export type { AdminFabMenuProps } from "./admin-fab-menu.presenter";

export function AdminFabMenu(props: AdminFabMenuProps) {
	return (
		<AdminFabMenuPresenter {...props}>
			{(model) => <AdminFabMenuView {...model} />}
		</AdminFabMenuPresenter>
	);
}
export default AdminFabMenu;
