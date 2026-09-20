import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@mixedpplparty/juicer-m3/avatar";
import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { ArrowBackIcon } from "@mixedpplparty/juicer-m3/icons/arrow-back";
import { SearchBar } from "@mixedpplparty/juicer-m3/search";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { Link } from "react-router";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";
import type { ServerHeaderViewModel } from "./server-header.presenter";
import { serverHeaderStyles } from "./server-header.styles";
export function ServerHeaderView({
	serverData,
	searchQuery,
	onSearchQueryChange,
	appBarScroll,
}: ServerHeaderViewModel) {
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
					nativeButton={false}
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
					<AvatarImage src={serverData.serverDataDiscord.icon} alt="" />
					<AvatarFallback aria-hidden="true">
						{serverData.serverDataDiscord.name.substring(0, 2)}
					</AvatarFallback>
				</Avatar>
				<div css={serverHeaderStyles.serverText}>
					<Text
						as="h1"
						typeRole="headline"
						size="medium"
						css={serverHeaderStyles.serverName}
					>
						{serverData.serverDataDiscord.name}
					</Text>
					<Text typeRole="body" size="medium">
						by {serverData.serverDataDiscord.ownerName},{" "}
						{serverData.serverDataDiscord.memberCount}명
					</Text>
				</div>
			</div>
		</header>
	);
}
