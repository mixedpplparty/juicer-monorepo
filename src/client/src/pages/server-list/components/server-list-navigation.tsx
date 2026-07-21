import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@mixedpplparty/juicer-m3/avatar";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import type { FilteredGuild } from "juicer-shared";
import { Link } from "react-router";

interface ServerListNavigationProps {
	guilds: FilteredGuild[];
	selectedServerId?: string;
}

export function ServerListNavigation({
	guilds,
	selectedServerId,
}: ServerListNavigationProps) {
	return (
		<nav aria-label="서버 목록">
			<List container="transparent">
				{guilds.map((guild) => (
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
								aria-current={
									selectedServerId === guild.id ? "page" : undefined
								}
							/>
						}
						selected={selectedServerId === guild.id}
					/>
				))}
				<ListItem
					leading={<AddIcon />}
					headline="juicer에 내 서버 추가하기"
					render={<a href={import.meta.env.VITE_BOT_INSTALL_URI} />}
				/>
			</List>
		</nav>
	);
}

export default ServerListNavigation;
