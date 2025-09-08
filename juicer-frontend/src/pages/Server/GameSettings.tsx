import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
	_deleteGame,
	_fetchMyDataInServer,
	_fetchServerData,
	_updateGameWithTagsAndRoles,
} from "../../queries/queries";
import type {
	Category,
	Game,
	Role,
	ServerDataDiscordRole,
	Tag,
	TagId,
} from "../../types/types";
import { Button } from "../../ui/components/Button";
import { ResponsiveCard } from "../../ui/components/Card";
import { CheckableChip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Input } from "../../ui/components/Input";
import { Option, Select } from "../../ui/components/Select";
import { Loading } from "../Loading/Loading";
export const GameSettings = () => {
	const [searchParams] = useSearchParams();
	const gameId = searchParams.get("gameId");
	const serverId = searchParams.get("serverId");
	const _serverData = useSuspenseQuery({
		queryKey: ["serverData", serverId],
		queryFn: () => _fetchServerData(serverId),
	});
	const [selectedTags, setSelectedTags] = useState<number[]>(
		_serverData.data?.server_data_db.games
			?.find((game: Game) => game.id === parseInt(gameId as string))
			?.tags?.map((tag: Tag) => tag.id) || [],
	);
	const [selectedRoles, setSelectedRoles] = useState<string[]>(
		_serverData.data?.server_data_db.games
			?.find((game: Game) => game.id === parseInt(gameId as string))
			?.roles_to_add?.map((role: Role) => role.id) || [],
	);
	const navigate = useNavigate();

	const queryClient = useQueryClient();

	const updateGameWithTagsAndRolesMutation = useMutation({
		mutationFn: ({
			serverId,
			gameId,
			gameName,
			gameDescription,
			gameCategory,
			gameTags,
			gameRoles,
		}: {
			serverId: string;
			gameId: string;
			gameName: string;
			gameDescription: string;
			gameCategory: string;
			gameTags: number[];
			gameRoles: string[];
		}) =>
			_updateGameWithTagsAndRoles(
				serverId,
				gameId,
				gameName,
				gameDescription,
				gameCategory,
				gameTags,
				gameRoles,
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["serverData", serverId] });
		},
		onError: (error) => {
			console.error(error);
		},
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

	const onGameSettingsChangeSubmitAction = async (formData: FormData) => {
		const gameName = formData.get("game-name");
		const gameDescription = formData.get("game-description");
		const gameCategory = formData.get("game-category");
		updateGameWithTagsAndRolesMutation.mutate({
			serverId: serverId as string,
			gameId: gameId as string,
			gameName: gameName as string,
			gameDescription: gameDescription as string,
			gameCategory: gameCategory as string,
			gameTags: selectedTags as number[],
			gameRoles: selectedRoles as string[],
		});
	};

	const deleteGameMutation = useMutation({
		mutationFn: ({ serverId, gameId }: { serverId: string; gameId: number }) =>
			_deleteGame(serverId, gameId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["serverData", serverId] });
			navigate(`/server?serverId=${serverId}`);
		},
		onError: (error) => {
			console.error(error);
		},
	});

	const handleDeleteGame = () => {
		deleteGameMutation.mutate({
			serverId: serverId as string,
			gameId: parseInt(gameId as string),
		});
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
							css={{
								display: "flex",
								flexDirection: "column",
								width: "100%",
								flex: 1,
							}}
						>
							<h1 css={{ margin: 0 }}>
								{_findGameById(gameId as string)?.name}
							</h1>
							<div>게임 설정</div>
						</div>
						<Button
							css={{
								background: "#ed5555",
								alignItems: "center",
								gap: "8px",
								display: "flex",
							}}
							onClick={handleDeleteGame}
						>
							<DeleteIcon css={{ width: "20px", height: "20px" }} />
							게임 삭제
						</Button>
					</div>
					<form
						action={onGameSettingsChangeSubmitAction}
						css={{ display: "flex", flexDirection: "column", gap: "12px" }}
					>
						<label htmlFor="game-name">게임 이름</label>
						<Input
							id="game-name"
							name="game-name"
							aria-required
							required
							defaultValue={_findGameById(gameId as string)?.name || ""}
						/>
						<label htmlFor="game-description">설명(선택)</label>
						<Input
							id="game-description"
							name="game-description"
							defaultValue={_findGameById(gameId as string)?.description || ""}
						/>
						<label htmlFor="game-category">카테고리 (선택)</label>
						<Select
							id="game-category"
							name="game-category"
							defaultValue={_findGameById(gameId as string)?.category?.id || ""}
						>
							<Option value="">카테고리 선택</Option>
							{_serverData.data?.server_data_db.categories?.map(
								(category: Category) => (
									<Option key={category.id} value={category.id}>
										{category.name}
									</Option>
								),
							)}
						</Select>
						<label htmlFor="game-tags">태그 부여(선택)</label>
						<div css={{ display: "flex", flexDirection: "row", gap: "6px" }}>
							{_serverData.data?.server_data_db.tags?.map((tag: Tag) => (
								<CheckableChip
									key={tag.id}
									value={tag.id}
									checked={selectedTags.includes(tag.id)}
									onChange={(checked) => {
										if (checked) {
											setSelectedTags([...selectedTags, tag.id]);
										} else {
											setSelectedTags(
												selectedTags.filter((id) => id !== tag.id),
											);
										}
									}}
								>
									{tag.name}
								</CheckableChip>
							))}
						</div>
						{_serverData.data?.server_data_db.tags?.length === 0 && (
							<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
								서버에 태그가 없습니다.
							</div>
						)}
						<label htmlFor="game-roles">역할 맵핑(선택)</label>
						<div css={{ display: "flex", flexDirection: "row", gap: "6px" }}>
							{_serverData.data?.server_data_db.roles?.map((role: Role) => (
								<CheckableChip
									key={role.id}
									value={role.id}
									checked={selectedRoles.includes(role.id)}
									onChange={(checked) => {
										if (checked) {
											setSelectedRoles([...selectedRoles, role.id]);
										} else {
											setSelectedRoles(
												selectedRoles.filter((id) => id !== role.id),
											);
										}
									}}
								>
									<_8pxCircle
										css={{
											backgroundColor: `rgb(${_findRoleById(role.id)?.color.join(",") || "255, 255, 255"})`,
										}}
									/>
									{_findRoleById(role.id)?.name}
								</CheckableChip>
							))}
						</div>
						{_serverData.data?.server_data_db.roles?.length === 0 && (
							<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
								서버에 역할이 없습니다.
							</div>
						)}
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
