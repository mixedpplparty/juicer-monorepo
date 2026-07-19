import { Suspense } from "react";
import ServerSettingsContent from "./components/server-settings-content";
import { ServerSettingsSkeleton } from "./components/server-settings-skeleton";

export function ServerSettingsPage() {
	return (
		<Suspense fallback={<ServerSettingsSkeleton />}>
			<ServerSettingsContent />
		</Suspense>
	);
}

export default ServerSettingsPage;
