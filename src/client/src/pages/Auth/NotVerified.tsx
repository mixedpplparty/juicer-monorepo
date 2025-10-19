import { Card } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const NotVerified = () => {
	return (
		<FullPageBase>
			<Card>
				<h1 css={{ margin: 0 }}>접근 불가</h1>
				<div>서버 이용을 위한 인증이 필요합니다.</div>
			</Card>
		</FullPageBase>
	);
};
