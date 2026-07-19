import { Text } from "juicer-m3";
import { centeredPageStyles } from "@/shared/styles/layout";

export function ServerListPage() {
	return (
		<section css={centeredPageStyles}>
			<Text typeRole="body" size="large">
				서버를 선택해 주세요
			</Text>
		</section>
	);
}

export default ServerListPage;
