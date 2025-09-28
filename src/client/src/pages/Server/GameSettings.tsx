import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type {
	Category,
	Game,
	Role,
	RoleRelationToGame,
	Tag,
	TagRelationToGame,
} from "juicer-shared";
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
	_deleteThumbnailFromGame,
	_fetchServerData,
	_updateGameWithTagsAndRoles,
	_uploadThumbnailToGame,
} from "../../remotes/remotes";
import { AnchorNoStyle } from "../../ui/components/Anchor";
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
	// usages of isLoading to be added later
	const [isLoading, startTransition] = useLoading();
	const [searchParams] = useSearchParams();
	const gameId = searchParams.get("gameId");
	const serverId = searchParams.get("serverId");
	const _serverDataQuery = useSuspenseQuery(
		_fetchServerData.query(serverId as string),
	);
	const _serverData = _serverDataQuery.data;
	const [selectedTags, setSelectedTags] = useState<number[]>(
		_serverData.server_data_db.games
			?.find((game: Game) => game.gameId === parseInt(gameId as string))
			?.gamesTags?.map((tag: TagRelationToGame) => tag.tagId) || [],
	);
	const [selectedRoles, setSelectedRoles] = useState<string[]>(
		_serverData.server_data_db.games
			?.find((game: Game) => game.gameId === parseInt(gameId as string))
			?.gamesRoles?.map((role: RoleRelationToGame) => role.roleId) || [],
	);
	const navigate = useNavigate();

	const onDeleteThumbnailAction = async () => {
		try {
			await startTransition(
				_deleteThumbnailFromGame(serverId as string, gameId as string),
			);
			showToast("Game thumbnail deleted", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
		navigate(`/server?serverId=${serverId}`);
	};

	const onGameSettingsChangeSubmitAction = async (formData: FormData) => {
		const gameName = formData.get("game-name");
		const gameDescription = formData.get("game-description");
		const gameCategory = formData.get("game-category");
		const gameThumbnail = formData.get("game-thumbnail");
		// TODO do whatever when loading
		try {
			if (gameThumbnail instanceof File && gameThumbnail.size > 0) {
				await startTransition(
					_uploadThumbnailToGame(
						serverId as string,
						gameId as string,
						gameThumbnail as File,
					),
				);
				showToast(
					"Game thumbnail uploaded. Trying to update other info...",
					"success",
				);
			}
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
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
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
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
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
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
								{_findGameById(_serverData, gameId as string)?.name}
							</h1>
							<div>주제 설정</div>
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
							주제 삭제
						</Button>
					</div>
					<form
						action={onGameSettingsChangeSubmitAction}
						css={{ display: "flex", flexDirection: "column", gap: "12px" }}
					>
						<label htmlFor="game-name">이름</label>
						<Input
							id="game-name"
							name="game-name"
							aria-required
							required
							defaultValue={
								_findGameById(_serverData, gameId as string)?.name || ""
							}
						/>
						<div css={{ display: "flex", flexDirection: "row", gap: "12px" }}>
							<label htmlFor="game-thumbnail" css={{ flex: 1 }}>
								썸네일(미선택 시 현행 유지)
							</label>
							<AnchorNoStyle
								css={{ cursor: "pointer", color: "#ed5555" }}
								onClick={onDeleteThumbnailAction}
							>
								썸네일 삭제
							</AnchorNoStyle>
						</div>
						<Input
							id="game-thumbnail"
							name="game-thumbnail"
							type="file"
							accept="image/*"
						/>
						<label htmlFor="game-description">설명(선택)</label>
						<Input
							id="game-description"
							name="game-description"
							defaultValue={
								_findGameById(_serverData, gameId as string)?.description || ""
							}
						/>
						<label htmlFor="game-category">카테고리 (선택)</label>
						<Select
							id="game-category"
							name="game-category"
							defaultValue={
								_findGameById(_serverData, gameId as string)?.categoryId || ""
							}
						>
							<Option value="">카테고리 선택</Option>
							{_serverData.server_data_db.categories?.map(
								(category: Category) => (
									<Option key={category.categoryId} value={category.categoryId}>
										{category.name}
									</Option>
								),
							)}
						</Select>
						<label htmlFor="game-tags">태그 부여(선택)</label>
						<div
							css={{
								display: "flex",
								flexDirection: "row",
								gap: "6px",
								flexWrap: "wrap",
							}}
						>
							{_serverData.server_data_db.tags?.map((tag: Tag) => (
								<CheckableChip
									key={tag.tagId}
									value={tag.tagId}
									checked={selectedTags.includes(tag.tagId)}
									onChange={(checked) => {
										if (checked) {
											setSelectedTags([...selectedTags, tag.tagId]);
										} else {
											setSelectedTags(
												selectedTags.filter((id) => id !== tag.tagId),
											);
										}
									}}
								>
									{tag.name}
								</CheckableChip>
							))}
						</div>
						{_serverData.server_data_db.tags?.length === 0 && (
							<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
								서버에 태그가 없습니다.
							</div>
						)}
						<label htmlFor="game-roles">역할 맵핑(선택)</label>
						<div
							css={{
								display: "flex",
								flexDirection: "row",
								gap: "6px",
								flexWrap: "wrap",
							}}
						>
							{filterOutEveryoneRole(
								_serverData,
								_serverData.server_data_db.roles || [],
							).map((role: Role | RoleRelationToGame) => (
								<CheckableChip
									key={role.roleId}
									value={role.roleId}
									checked={selectedRoles.includes(role.roleId)}
									onChange={(checked) => {
										if (checked) {
											setSelectedRoles([...selectedRoles, role.roleId]);
										} else {
											setSelectedRoles(
												selectedRoles.filter((id) => id !== role.roleId),
											);
										}
									}}
								>
									<_8pxCircle
										css={{
											backgroundColor:
												_findRoleById(_serverData, role.roleId)?.color ||
												"#ffffff",
										}}
									/>
									{_findRoleById(_serverData, role.roleId)?.name}
								</CheckableChip>
							))}
						</div>
						{_serverData.server_data_db.roles?.length === 0 && (
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
