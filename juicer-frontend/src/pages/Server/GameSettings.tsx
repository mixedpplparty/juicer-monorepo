import { useSearchParams } from "react-router";

export const GameSettings = () => {
	const [searchParams] = useSearchParams();
	const gameId = searchParams.get("gameId");
	const serverId = searchParams.get("serverId");
	return (
		<div>
			<h1>Game Settings</h1>
			{gameId}
			{serverId}
		</div>
	);
};
