import DiscordLogoSVG from "../../assets/Discord-Symbol-White.svg?react";
import { AnchorNoStyle } from "../../ui/components/Anchor";
import { Button } from "../../ui/components/Button";
import { ResponsiveCard } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const Landing = () => {
	return (
		<FullPageBase>
			<ResponsiveCard css={{ gap: "12px" }}>
				<h1 css={{ margin: 0 }}>juicer</h1>
				<div>
					<AnchorNoStyle href={import.meta.env.VITE_USER_AUTH_URI}>
						<Button
							css={{
								background: "#5865F2",
								display: "flex",
								gap: "8px",
								width: "100%",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<DiscordLogoSVG css={{ width: "16px" }} /> Discord로 로그인
						</Button>
					</AnchorNoStyle>
				</div>
			</ResponsiveCard>
		</FullPageBase>
	);
};
