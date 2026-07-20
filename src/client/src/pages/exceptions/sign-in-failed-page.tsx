import { Button } from "@mixedpplparty/juicer-m3/button";
import { Card } from "@mixedpplparty/juicer-m3/card";
import { ErrorIcon } from "@mixedpplparty/juicer-m3/icons/error";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { exceptionPageStyles } from "./exception-page.styles";

export function SignInFailedPage() {
	return (
		<main css={exceptionPageStyles.fullPage}>
			<Card
				variant="elevated"
				css={exceptionPageStyles.card}
				aria-labelledby="sign-in-failed-title"
			>
				<span css={exceptionPageStyles.icon} aria-hidden="true">
					<ErrorIcon />
				</span>
				<Text
					as="h1"
					id="sign-in-failed-title"
					typeRole="headline"
					size="medium"
					css={exceptionPageStyles.title}
				>
					로그인에 실패했어요
				</Text>
				<Text
					as="p"
					typeRole="body"
					size="large"
					css={exceptionPageStyles.description}
				>
					Discord 로그인이 끝까지 완료되지 않았어요. 잠시 후 다시 시도해 주세요.
				</Text>
				<Button
					render={<a href={import.meta.env.VITE_USER_AUTH_URI} />}
					nativeButton={false}
					css={exceptionPageStyles.action}
				>
					다시 로그인하기
				</Button>
			</Card>
		</main>
	);
}

export default SignInFailedPage;
