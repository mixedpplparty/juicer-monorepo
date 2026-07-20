import { AppBar } from "@mixedpplparty/juicer-m3/app-bar";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useScrollState } from "@/shared/browser/use-scroll-state";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";
import { myInfoQueryOptions } from "../api/queries";
import LogoutDialog from "./logout-dialog";
import { serverListStyles } from "./server-list.styles";
import ServerListNavigation from "./server-list-navigation";

export function ServerList() {
	const { data: myData } = useSuspenseQuery(myInfoQueryOptions());
	const { serverId } = useParams();
	const appBarScroll = useScrollState<HTMLElement>();

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

export default ServerList;
