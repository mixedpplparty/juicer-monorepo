import { useNavigate } from "react-router";
import DiscordLogoSVG from "../../assets/Discord-Symbol-White.svg?react";
import { Button } from "../../ui/components/Button";
import { Card } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const Landing = () => {
	const _navigate = useNavigate();
	return (
		<FullPageBase>
			<Card>
				<h1 css={{ margin: 0 }}>juicer</h1>
				<div>
					<a
						href={import.meta.env.VITE_USER_AUTH_URI}
						css={{ color: "inherit", textDecoration: "inherit" }}
					>
						<Button css={{ background: "#5865F2" }}>
							<DiscordLogoSVG css={{ width: "16px" }} /> Sign in with Discord
						</Button>
					</a>
				</div>
			</Card>
		</FullPageBase>
	);
};
