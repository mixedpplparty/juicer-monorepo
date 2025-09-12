import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
	_findGameById,
	_findRoleById,
	filterOutEveryoneRole,
} from "../../functions/ServerFunctions";
import { useLoading } from "../../hooks/useLoading";
import { useToast } from "../../hooks/useToast";
import {
	_deleteGame,
	_fetchServerData,
	_updateGameWithTagsAndRoles,
} from "../../remotes/remotes";
import type { Category, Game, Role, Tag } from "../../types/types";
import { Button } from "../../ui/components/Button";
import { ResponsiveCard } from "../../ui/components/Card";
import { CheckableChip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Input } from "../../ui/components/Input";
import { Option, Select } from "../../ui/components/Select";
import { Loading } from "../Loading/Loading";
export const GameSettings = () => {
	const { showToast } = useToast();
	const [isLoading, startTransition] = useLoading();
	const [searchParams] = useSearchParams();
	const gameId = searchParams.get("gameId");
	const serverId = searchParams.get("serverId");
	const _serverDataQuery = useSuspenseQuery(
		_fetchServerData.query(serverId as string),
	);
	const _serverData = _serverDataQuery.data;
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

	const onGameSettingsChangeSubmitAction = async (formData: FormData) => {
		const gameName = formData.get("game-name");
		const gameDescription = formData.get("game-description");
		const gameCategory = formData.get("game-category");
		// TODO do whatever when loading
		try {
			await startTransition(
				_updateGameWithTagsAndRoles(
					serverId as string,
					gameId as string,
					gameName as string,
					gameDescription as string,
					gameCategory as string,
					selectedTags as number[],
					selectedRoles as string[],
				),
			);
			showToast("Game updated", "success");
		} catch (error) {
			showToast(error.response.data.detail, "error");
		}
		await _serverDataQuery.refetch();
		navigate(`/server?serverId=${serverId}`);
	};

	const handleDeleteGame = async () => {
		// TODO do whatever when loading
		try {
			await startTransition(
				_deleteGame(serverId as string, parseInt(gameId as string)),
			);
			showToast("Game deleted", "success");
		} catch (error) {
			showToast(error.response.data.detail, "error");
		}
		await _serverDataQuery.refetch();
		navigate(`/server?serverId=${serverId}`);
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
								{_findGameById(_serverData.data, gameId as string)?.name}
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
							defaultValue={
								_findGameById(_serverData.data, gameId as string)?.name || ""
							}
						/>
						<label htmlFor="game-description">설명(선택)</label>
						<Input
							id="game-description"
							name="game-description"
							defaultValue={
								_findGameById(_serverData.data, gameId as string)
									?.description || ""
							}
						/>
						<label htmlFor="game-category">카테고리 (선택)</label>
						<Select
							id="game-category"
							name="game-category"
							defaultValue={
								_findGameById(_serverData.data, gameId as string)?.category
									?.id || ""
							}
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
							{filterOutEveryoneRole(
								_serverData.data,
								_serverData.data?.server_data_db.roles || [],
							).map((role: Role) => (
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
											backgroundColor: `rgb(${_findRoleById(_serverData.data, role.id)?.color.join(",") || "255, 255, 255"})`,
										}}
									/>
									{_findRoleById(_serverData.data, role.id)?.name}
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
