import { Card } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const NoAdminPerms = () => {
	return (
		<FullPageBase>
			<Card>
				<h1 css={{ margin: 0 }}>접근 불가</h1>
				<div>서버 관리자 권한이 없습니다.</div>
			</Card>
		</FullPageBase>
	);
};
