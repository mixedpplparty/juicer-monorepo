import { useSuspenseQuery } from "@tanstack/react-query";
import { AddIcon, AppBar, List, ListItem } from "juicer-m3";
import type { FilteredGuild } from "juicer-shared";
import { _fetchMyInfo } from "../../remotes/remotes";

export function ServerList() {
	const { data: _myData } = useSuspenseQuery(_fetchMyInfo.query());

	return (
		<nav>
			<AppBar title="서버 목록">Servers</AppBar>
			<List>
				{_myData.guilds.map((guild: FilteredGuild) => (
					<ListItem
						key={guild.id}
						headline={guild.name}
							leading={
								<img
									src={guild.icon ?? undefined}
									alt={`${guild.name} 서버 아이콘`}
								/>
							}
						supportingText={`by ${guild.ownerName}`}
					/>
				))}
				<ListItem leading={<AddIcon />} headline="juicer에 내 서버 추가하기" />
			</List>
		</nav>
	);
}
