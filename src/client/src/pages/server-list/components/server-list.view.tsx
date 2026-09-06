import { AppBar } from "@mixedpplparty/juicer-m3/app-bar";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";
import LogoutDialog from "./logout-dialog";
import type { ServerListViewModel } from "./server-list.presenter";
import { serverListStyles } from "./server-list.styles";
import ServerListNavigation from "./server-list-navigation";
export function ServerListView({
	myData,
	serverId,
	appBarScroll,
}: ServerListViewModel) {
	return (
		<div css={serverListStyles.root}>
			<div css={serverListStyles.scrollArea}>
				<AppBar
					ref={appBarScroll.ref}
					title="서버 목록"
					container="transparent"
					data-scrolled={appBarScroll.isScrolled}
					css={[appBarStyles.root, hideOnDesktop]}
				/>
				<ServerListNavigation
					guilds={myData.guilds}
					selectedServerId={serverId}
				/>
			</div>
			<LogoutDialog />
		</div>
	);
}
