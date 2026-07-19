import { AppBar } from "@mixedpplparty/juicer-m3/app-bar";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@mixedpplparty/juicer-m3/avatar";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { FilteredGuild } from "juicer-shared";
import { Link, useParams } from "react-router";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";
import { useScrollState } from "../../hooks/use-scroll-state";
import { myInfoQueryOptions } from "../api/queries";

export function ServerList() {
	const { data: myData } = useSuspenseQuery(myInfoQueryOptions());
	const params = useParams();
	const appBarScroll = useScrollState<HTMLElement>();

	return (
		<>
			<AppBar
				ref={appBarScroll.ref}
				title="서버 목록"
				container="transparent"
				data-scrolled={appBarScroll.isScrolled}
				css={[appBarStyles.root, hideOnDesktop]}
			/>
			<nav aria-label="서버 목록">
				<List container="transparent">
					{myData.guilds.map((guild: FilteredGuild) => {
						const selected = params.serverId === guild.id;

						return (
							<ListItem
								key={guild.id}
								headline={guild.name}
								leading={
									<Avatar>
										<AvatarImage src={guild.icon} alt="" />
										<AvatarFallback aria-hidden="true">
											{guild.name.substring(0, 2)}
										</AvatarFallback>
									</Avatar>
								}
								supportingText={`by ${guild.ownerName}`}
								render={
									<Link
										to={guild.id}
										aria-current={selected ? "page" : undefined}
									/>
								}
								selected={selected}
							/>
						);
					})}
					<ListItem
						leading={<AddIcon />}
						headline="juicer에 내 서버 추가하기"
						render={<a href={import.meta.env.VITE_BOT_INSTALL_URI} />}
					/>
				</List>
			</nav>
		</>
	);
}

export default ServerList;
