import LockIcon from "@mui/icons-material/Lock";
import { Card } from "../../ui/components/Card";
import { EmptyState } from "../../ui/components/EmptyState";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const NotVerified = () => {
	return (
		<FullPageBase>
			<Card css={{ maxWidth: "440px" }}>
				<EmptyState
					tone="neutral"
					icon={<LockIcon css={{ width: "28px", height: "28px" }} />}
					title="아직 입장 전이에요 🔒"
					description="이 서버는 인증된 멤버만 이용할 수 있어요. 서버 관리자에게 인증 역할을 요청하면 바로 들어올 수 있어요."
				/>
			</Card>
		</FullPageBase>
	);
};
