import { Text } from "juicer-m3";
import { centeredPageStyles } from "@/shared/styles/layout";

export function ServerListEmptyState() {
	return (
		<div css={centeredPageStyles}>
			<Text as="p" typeRole="body" size="large">
				서버를 선택해 주세요
			</Text>
		</div>
	);
}

export default ServerListEmptyState;
