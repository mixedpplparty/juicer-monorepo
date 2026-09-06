import RoleSettings from "./role-settings";
import { RoleSettingsFetch } from "./role-settings.fetch";

export function RoleSettingsSection({ serverId }: { serverId: string }) {
	return (
		<RoleSettingsFetch serverId={serverId}>
			{(roleSettings, refetchRoles) => (
				<RoleSettings
					serverId={serverId}
					roleSettings={roleSettings}
					refetchRoles={refetchRoles}
				/>
			)}
		</RoleSettingsFetch>
	);
}
export default RoleSettingsSection;
