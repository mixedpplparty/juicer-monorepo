import { Text } from "@mixedpplparty/juicer-m3/text";
import { centeredPageStyles } from "@/shared/styles/layout";

export function ServerListEmptyPage() {
	return (
		<div css={centeredPageStyles}>
			<Text as="p" typeRole="body" size="large">
				서버를 선택해 주세요
			</Text>
		</div>
	);
}

export default ServerListEmptyPage;
