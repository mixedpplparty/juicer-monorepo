import { Button, Text } from "juicer-m3";
import { landingPageStyles } from "./landing-content.styles";

export function LandingContent() {
	return (
		<section aria-labelledby="landing-title">
			<Text
				typeRole="display"
				size="large"
				emphasized
				id="landing-title"
				as="h1"
			>
				juicer
			</Text>
			<p>Discord 역할을 관리해 보세요</p>
			<Button
				size="md"
				css={landingPageStyles.loginLink}
				render={
					<a
						href={import.meta.env.VITE_USER_AUTH_URI}
						aria-label="Discord로 로그인하기"
					/>
				}
				aria-label="Discord로 로그인하기"
				nativeButton={false}
			>
				<img
					src="/discord-logo.svg"
					alt=""
					aria-hidden="true"
					css={landingPageStyles.discordLogo}
				/>
				<span>로 로그인하기</span>
			</Button>
		</section>
	);
}

export default LandingContent;
