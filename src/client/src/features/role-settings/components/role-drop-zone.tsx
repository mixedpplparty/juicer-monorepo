import {
	RoleDropZonePresenter,
	type RoleDropZoneProps,
} from "./role-drop-zone.presenter";
import { RoleDropZoneView } from "./role-drop-zone.view";

export type { RoleDropZoneProps } from "./role-drop-zone.presenter";
export function RoleDropZone(props: RoleDropZoneProps) {
	return (
		<RoleDropZonePresenter {...props}>
			{(model) => <RoleDropZoneView {...model} />}
		</RoleDropZonePresenter>
	);
}
export default RoleDropZone;
