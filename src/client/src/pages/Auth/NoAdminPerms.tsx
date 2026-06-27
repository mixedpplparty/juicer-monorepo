import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { Card } from "../../ui/components/Card";
import { EmptyState } from "../../ui/components/EmptyState";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const NoAdminPerms = () => {
	return (
		<FullPageBase>
			<Card css={{ maxWidth: "440px" }}>
				<EmptyState
					tone="neutral"
					icon={
						<AdminPanelSettingsIcon css={{ width: "28px", height: "28px" }} />
					}
					title="관리자만 들어올 수 있어요"
					description="이 페이지는 서버 관리자 전용이에요. 설정을 바꾸려면 서버 관리자에게 요청해 주세요."
				/>
			</Card>
		</FullPageBase>
	);
};
