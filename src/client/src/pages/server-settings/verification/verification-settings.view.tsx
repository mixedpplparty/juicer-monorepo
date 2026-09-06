import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { Switch } from "@mixedpplparty/juicer-m3/switch";
import SettingsSection from "../components/settings-section";
import type { VerificationSettingsViewModel } from "./verification-settings.presenter";
import { verificationSettingsStyles } from "./verification-settings.styles";
export function VerificationSettingsView({
	changeVerificationPending,
	changeVerification,
	checked,
}: VerificationSettingsViewModel) {
	return (
		<SettingsSection title="서버 보안">
			<List
				container="transparent"
				aria-label="서버 보안 설정"
				css={verificationSettingsStyles.list}
			>
				<ListItem
					css={verificationSettingsStyles.item}
					headline="특정 역할 보유자만 juicer 이용 가능"
					supportingText="켜면 아래 역할을 가진 멤버만 주제를 보고 역할을 받을 수 있습니다."
					trailing={
						<Switch
							checked={checked}
							disabled={changeVerificationPending}
							aria-label="특정 역할 보유자만 juicer 이용 가능"
							onCheckedChange={(verificationRequired) =>
								void changeVerification(verificationRequired)
							}
						/>
					}
				/>
			</List>
		</SettingsSection>
	);
}
