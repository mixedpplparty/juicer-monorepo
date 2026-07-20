import { Text } from "@mixedpplparty/juicer-m3/text";
import type { ReactNode } from "react";
import { serverSettingsPageStyles } from "./server-settings-content.styles";

interface SettingsSectionProps {
	title: string;
	children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
	return (
		<section css={serverSettingsPageStyles.section}>
			<Text
				as="h2"
				typeRole="label"
				size="large"
				css={serverSettingsPageStyles.sectionTitle}
			>
				{title}
			</Text>
			{children}
		</section>
	);
}

export default SettingsSection;
