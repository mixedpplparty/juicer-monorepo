import { Text } from "juicer-m3";
import { fullCenteredPage } from "../../styles/styles";

export function ServerListPage() {
	return (
		<section
			css={[fullCenteredPage, { display: "flex", flexDirection: "column" }]}
		>
			<Text typeRole="body" size="large">
				서버를 선택해 주세요
			</Text>
		</section>
	);
}

export default ServerListPage;
