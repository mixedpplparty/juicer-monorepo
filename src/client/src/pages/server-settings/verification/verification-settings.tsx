import {
	VerificationSettingsPresenter,
	type VerificationSettingsProps,
} from "./verification-settings.presenter";
import { VerificationSettingsView } from "./verification-settings.view";

export type { VerificationSettingsProps } from "./verification-settings.presenter";

export function VerificationSettings(props: VerificationSettingsProps) {
	return (
		<VerificationSettingsPresenter {...props}>
			{(model) => <VerificationSettingsView {...model} />}
		</VerificationSettingsPresenter>
	);
}
export default VerificationSettings;
