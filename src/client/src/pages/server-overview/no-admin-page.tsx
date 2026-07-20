import { Card } from "@mixedpplparty/juicer-m3/card";
import { LockIcon } from "@mixedpplparty/juicer-m3/icons/lock";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { useOutletContext } from "react-router";
import { exceptionPageStyles } from "@/pages/exceptions/exception-page.styles";
import { ServerPageAppBar } from "./components/server-page-app-bar";
import type { ServerDetailsOutletContext } from "./server-details-context";

export function NoAdminPage() {
	const { serverId, serverData } =
		useOutletContext<ServerDetailsOutletContext>();

	return (
		<>
			<ServerPageAppBar
				title="접근 권한 없음"
				subtitle={`@${serverData.serverDataDiscord.name}`}
				backTo={`/servers/${serverId}`}
				backLabel="서버 상세로 돌아가기"
			/>
			<main css={exceptionPageStyles.fullPage}>
				<Card
					variant="outlined"
					css={exceptionPageStyles.card}
					aria-labelledby="no-admin-title"
				>
					<span css={exceptionPageStyles.icon} aria-hidden="true">
						<LockIcon />
					</span>
					<Text
						as="h1"
						id="no-admin-title"
						typeRole="headline"
						size="medium"
						css={exceptionPageStyles.title}
					>
						관리자만 들어올 수 있어요
					</Text>
					<Text
						as="p"
						typeRole="body"
						size="large"
						css={exceptionPageStyles.description}
					>
						이 페이지는 서버 관리자 전용이에요. 설정을 바꾸려면 서버 관리자에게
						요청해 주세요.
					</Text>
				</Card>
			</main>
		</>
	);
}

export default NoAdminPage;
