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
import { useScrollState } from "@/hooks/use-scroll-state";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";
import { serverHeaderStyles } from "./server-header.styles";

export interface ServerHeaderProps {
	serverData: ServerData;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
}

export function ServerHeader({
	serverData: _serverData,
	searchQuery,
	onSearchQueryChange,
}: ServerHeaderProps) {
	const appBarScroll = useScrollState<HTMLElement>();

	return (
		<header
			ref={appBarScroll.ref}
			data-scrolled={appBarScroll.isScrolled}
			css={serverHeaderStyles.root}
		>
			<div
				data-scrolled={appBarScroll.isScrolled}
				css={[
					appBarStyles.root,
					appBarStyles.insetInServerPage,
					serverHeaderStyles.searchRow,
				]}
			>
				<IconButton
					aria-label="서버 목록으로 돌아가기"
					render={<Link to="/servers" />}
					css={hideOnDesktop}
				>
					<ArrowBackIcon />
				</IconButton>
				<SearchBar
					label="주제 검색"
					placeholder="주제 검색"
					value={searchQuery}
					onChange={(event) => onSearchQueryChange(event.target.value)}
				/>
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
