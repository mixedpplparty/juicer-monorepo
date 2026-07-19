import { CircularProgress, Text } from "juicer-m3";
import { centeredPageStyles } from "@/shared/styles/layout";

export function AuthLoading() {
	return (
		<div css={centeredPageStyles}>
			<CircularProgress />
			<Text typeRole="body" size="large">
				로그인 상태를 확인하는 중..
			</Text>
		</div>
	);
}

export default AuthLoading;
