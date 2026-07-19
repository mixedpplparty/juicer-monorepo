import { useSuspenseQuery } from "@tanstack/react-query";
import { serverQueryOptions } from "../api/server-queries";
import ServerHeader from "./server-header";

export interface ServerInfoProps {
	serverId: string;
}

export function ServerInfo({ serverId }: ServerInfoProps) {
	const { data: serverData } = useSuspenseQuery(serverQueryOptions(serverId));
	const server = serverData.serverDataDiscord;

	return (
		<section>
			<ServerHeader serverData={serverData} />
			<article>
				<header>
					{server.icon ? (
						<img src={server.icon} alt={`${server.name} 서버 아이콘`} />
					) : null}
					<div>
						<h1>{server.name}</h1>
						<p>
							by {server.ownerName}, {server.memberCount}명
						</p>
					</div>
				</header>

				<section>
					<h2>내 프로필</h2>
					<p>서버 프로필과 역할 정보가 여기에 표시됩니다.</p>
				</section>

				<section>
					<h2>주제 목록</h2>
					{serverData.serverDataDb?.games?.length ? (
						<ul>
							{serverData.serverDataDb.games.map((game) => (
								<li key={game.gameId}>{game.name}</li>
							))}
						</ul>
					) : (
						<p>등록된 주제가 없습니다.</p>
					)}
				</section>
			</article>
		</section>
	);
}

export default ServerInfo;
