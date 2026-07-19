import { CircularProgress } from "@mixedpplparty/juicer-m3/progress";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { centeredPageStyles } from "@/shared/styles/layout";

export function AuthLoading() {
	return (
		<div
			role="status"
			aria-label="로그인 상태 확인 중"
			css={centeredPageStyles}
		>
			<CircularProgress aria-hidden="true" />
			<Text typeRole="body" size="large">
				로그인 상태를 확인하는 중..
			</Text>
		</div>
	);
}

export default AuthLoading;
