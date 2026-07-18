import { Button, Text } from "juicer-m3";

export function LandingPage() {
	return (
		<main
			css={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				textAlign: "center",
			}}
		>
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
					css={{ textDecoration: "none" }}
					render={
						<a
							href={`${import.meta.env.VITE_USER_AUTH_URI}`}
							aria-label="Discord로 로그인하기"
						/>
					}
					aria-label="Discord로 로그인하기"
				>
					<img
						src="/discord-logo.svg"
						alt="Discord"
						aria-hidden="true"
						css={{ display: "block", width: "5.75rem", height: "auto" }}
					/>
					<span>로 로그인하기</span>
				</Button>
			</section>
		</main>
	);
}

export default LandingPage;
