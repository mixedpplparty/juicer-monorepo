import { Button } from "@mixedpplparty/juicer-m3/button";
import { Text } from "@mixedpplparty/juicer-m3/text";
import type { ServerRegistrationPageViewModel } from "./server-registration-page.presenter";
import { serverRegistrationPageStyles } from "./server-registration-page.styles";
export function ServerRegistrationPageView({
	registerServerPending,
	registerServerError,
	registerServer,
}: ServerRegistrationPageViewModel) {
	return (
		<section
			css={serverRegistrationPageStyles.root}
			aria-labelledby="server-registration-title"
		>
			<div css={serverRegistrationPageStyles.copy}>
				<Text
					as="h1"
					id="server-registration-title"
					typeRole="headline"
					size="medium"
				>
					서버를 juicer에 등록해 주세요
				</Text>
				<Text
					as="p"
					typeRole="body"
					size="large"
					css={serverRegistrationPageStyles.description}
				>
					juicer 데이터베이스에 이 서버를 추가하면 주제와 역할을 관리할 수
					있어요.
				</Text>
			</div>

			<Button
				type="button"
				disabled={registerServerPending}
				onClick={() => void registerServer()}
			>
				{registerServerPending ? "서버 등록하는 중..." : "서버 등록하기"}
			</Button>

			{registerServerError !== null && (
				<Text
					as="p"
					typeRole="body"
					size="medium"
					role="alert"
					css={serverRegistrationPageStyles.error}
				>
					{registerServerError.message}
				</Text>
			)}
		</section>
	);
}
export function ServerRegistrationUnavailablePage() {
	return (
		<section
			css={serverRegistrationPageStyles.root}
			aria-labelledby="server-registration-unavailable-title"
		>
			<div css={serverRegistrationPageStyles.copy}>
				<Text
					as="h1"
					id="server-registration-unavailable-title"
					typeRole="headline"
					size="medium"
				>
					서버 등록이 필요해요
				</Text>
				<Text
					as="p"
					typeRole="body"
					size="large"
					css={serverRegistrationPageStyles.description}
				>
					서버 관리자만 이 서버를 juicer에 등록할 수 있어요. 서버 관리자에게
					등록을 요청해 주세요.
				</Text>
			</div>
		</section>
	);
}
