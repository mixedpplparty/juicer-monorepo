import { useSuspenseQuery } from "@tanstack/react-query";
import {
	AddIcon,
	AppBar,
	Avatar,
	AvatarFallback,
	AvatarImage,
	List,
	ListItem,
} from "juicer-m3";
import type { FilteredGuild } from "juicer-shared";
import { Link, useParams } from "react-router";
import { hideOnDesktop } from "@/shared/styles/responsive";
import { myInfoQueryOptions } from "../api/server-queries";

export function ServerList() {
	const { data: myData } = useSuspenseQuery(myInfoQueryOptions());
	const params = useParams();

	return (
		<nav>
			<AppBar title="서버 목록" container="transparent" css={hideOnDesktop} />
			<List container="transparent">
				{myData.guilds.map((guild: FilteredGuild) => (
					<ListItem
						key={guild.id}
						headline={guild.name}
						leading={
							<Avatar>
								<AvatarImage src={guild.icon} />
								<AvatarFallback>{guild.name.substring(0, 2)}</AvatarFallback>
							</Avatar>
						}
						supportingText={`by ${guild.ownerName}`}
						render={<Link to={guild.id} />}
						selected={params.serverId === guild.id}
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

export default ServerList;
