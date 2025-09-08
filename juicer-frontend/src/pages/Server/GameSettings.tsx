import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { _fetchMyDataInServer, _fetchServerData } from "../../queries/queries";
import type { Category, Game, ServerDataDiscordRole } from "../../types/types";
import { Button } from "../../ui/components/Button";
import { ResponsiveCard } from "../../ui/components/Card";
import { CheckableChip } from "../../ui/components/Chip";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Input } from "../../ui/components/Input";
import { Option, Select } from "../../ui/components/Select";
import { Loading } from "../Loading/Loading";
export const GameSettings = () => {
	const [searchParams] = useSearchParams();
	const gameId = searchParams.get("gameId");
	const serverId = searchParams.get("serverId");
	const navigate = useNavigate();
	const _myDataInServer = useSuspenseQuery({
		queryKey: ["myDataInServer", serverId],
		queryFn: () => _fetchMyDataInServer(serverId),
	});

	const _serverData = useSuspenseQuery({
		queryKey: ["serverData", serverId],
		queryFn: () => _fetchServerData(serverId),
	});

	const _findRoleById = (roleId: string): ServerDataDiscordRole | undefined => {
		return _serverData.data?.server_data_discord.roles?.find(
			(r: ServerDataDiscordRole) => r.id === roleId,
		);
	};

	const _findGameById = (gameId: string): Game | undefined => {
		return _serverData.data?.server_data_db.games?.find(
			(g: Game) => g.id === parseInt(gameId),
		);
	};

	return (
		<Suspense fallback={<Loading />}>
			<FullPageBase>
				<ResponsiveCard css={{ gap: "12px" }}>
					<div
						css={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							gap: "12px",
						}}
					>
						<Button
							css={{ background: "none", alignItems: "center" }}
							onClick={() => navigate(`/server?serverId=${serverId}`)}
						>
							<ArrowBackIcon css={{ width: "24px", height: "24px" }} />
						</Button>
						<div
							css={{ display: "flex", flexDirection: "column", width: "100%" }}
						>
							<h1 css={{ margin: 0 }}>
								{_findGameById(gameId as string)?.name}
							</h1>
							<div>게임 설정</div>
						</div>
					</div>
					<form
						action={() => {}}
						css={{ display: "flex", flexDirection: "column", gap: "12px" }}
					>
						<label htmlFor="game-name">게임 이름</label>
						<Input
							id="game-name"
							name="game-name"
							aria-required
							required
							defaultValue={_findGameById(gameId as string)?.name}
						/>
						<label htmlFor="game-description">설명 (선택)</label>
						<Input
							id="game-description"
							name="game-description"
							defaultValue={_findGameById(gameId as string)?.description}
						/>
						<label htmlFor="game-category">카테고리 (선택)</label>
						<Select id="game-category" name="game-category" defaultValue="">
							<Option value="">카테고리 선택</Option>
							{_serverData.data?.server_data_db.categories?.map(
								(category: Category) => (
									<Option key={category.id} value={category.id}>
										{category.name}
									</Option>
								),
							)}
						</Select>
						<label htmlFor="game-tags">태그 (선택)</label>
						<CheckableChip>test</CheckableChip>
						<Button
							css={{
								background: "#5865F2",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "100%",
								gap: "8px",
							}}
							type="submit"
						>
							저장
						</Button>
					</form>
				</ResponsiveCard>
			</FullPageBase>
		</Suspense>
	);
};
