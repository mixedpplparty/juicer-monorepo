import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
import { AnchorNoStyle } from "../../ui/components/Anchor";
import { Button } from "../../ui/components/Button";
import { Card } from "../../ui/components/Card";
import { EmptyState } from "../../ui/components/EmptyState";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const SignInFailed = () => {
	return (
		<FullPageBase>
			<Card css={{ maxWidth: "440px" }}>
				<EmptyState
					tone="error"
					icon={
						<SentimentDissatisfiedIcon
							css={{ width: "28px", height: "28px" }}
						/>
					}
					title="로그인에 실패했어요"
					description="Discord 로그인이 끝까지 완료되지 않았어요. 잠시 후 다시 시도해 주세요."
					action={
						<AnchorNoStyle href={import.meta.env.VITE_USER_AUTH_URI}>
							<Button
								css={{
									background: "#5865F2",
									display: "flex",
									gap: "8px",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								다시 로그인하기
							</Button>
						</AnchorNoStyle>
					}
				/>
			</Card>
		</FullPageBase>
	);
};
