import { CircularProgress, Text } from "juicer-m3";
import fullCenteredPage from "../styles/full-centered-page";

export function AuthLoading() {
	return (
		<div css={[fullCenteredPage, { display: "flex", flexDirection: "column" }]}>
			<CircularProgress />
			<Text typeRole="body" size="large">
				로그인 상태를 확인하는 중..
			</Text>
		</div>
	);
}

export default AuthLoading;
