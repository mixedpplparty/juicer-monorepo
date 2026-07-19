import { ArrowBackIcon, IconButton, SearchBar } from "juicer-m3";
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
				<SearchBar label="서버 검색" placeholder="검색" />
			</div>

			<div css={serverHeaderStyles.details}>Div 1</div>
		</header>
	);
}

export default ServerHeader;
