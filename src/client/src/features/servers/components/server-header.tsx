import {
	ArrowBackIcon,
	Avatar,
	AvatarFallback,
	AvatarImage,
	IconButton,
	SearchBar,
	Text,
} from "juicer-m3";
import type { ServerData } from "juicer-shared";
import { Link } from "react-router";
import { hideOnDesktop } from "@/shared/styles/responsive";
import { serverHeaderStyles } from "./server-header.styles";

export interface ServerHeaderProps {
	serverData: ServerData;
}

export function ServerHeader({ serverData: _serverData }: ServerHeaderProps) {
	return (
		<header css={serverHeaderStyles.root}>
			<div css={serverHeaderStyles.searchRow}>
				<IconButton
					aria-label="서버 목록으로 돌아가기"
					render={<Link to="/servers" />}
					css={hideOnDesktop}
				>
					<ArrowBackIcon />
				</IconButton>
				<SearchBar label="주제 검색" placeholder="주제 검색" />
			</div>

			<div css={serverHeaderStyles.details}>
				<Avatar size="lg">
					<AvatarImage src={_serverData.serverDataDiscord.icon} />
					<AvatarFallback>
						{_serverData.serverDataDiscord.name.substring(0, 2)}
					</AvatarFallback>
				</Avatar>
				<div css={serverHeaderStyles.serverText}>
					<Text typeRole="headline" size="medium">
						{_serverData.serverDataDiscord.name}
					</Text>
					<Text typeRole="body" size="medium">
						by {_serverData.serverDataDiscord.ownerName},{" "}
						{_serverData.serverDataDiscord.memberCount}명
					</Text>
				</div>
			</div>
		</header>
	);
}

export default ServerHeader;
