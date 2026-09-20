import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@mixedpplparty/juicer-m3/avatar";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { Link } from "react-router";
import type { ServerListNavigationViewModel } from "./server-list-navigation.presenter";
export function ServerListNavigationView({
	servers,
	installUrl,
}: ServerListNavigationViewModel) {
	return (
		<nav aria-label="서버 목록">
			<List container="transparent">
				{servers.map((guild) => (
					<ListItem
						key={guild.id}
						headline={guild.name}
						leading={
							<Avatar>
								<AvatarImage src={guild.icon} alt="" />
								<AvatarFallback aria-hidden="true">
									{guild.initials}
								</AvatarFallback>
							</Avatar>
						}
						supportingText={guild.ownerText}
						render={
							<Link
								to={guild.id}
								aria-current={guild.selected ? "page" : undefined}
							/>
						}
						selected={guild.selected}
					/>
				))}
				<ListItem
					leading={<AddIcon />}
					headline="juicer에 내 서버 추가하기"
					render={<a href={installUrl} />}
				/>
			</List>
		</nav>
	);
}
