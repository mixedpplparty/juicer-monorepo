import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import TagIcon from "@mui/icons-material/Tag";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type {
	Category,
	Game,
	RoleRelationToGame,
	ServerDataDiscordChannel,
	Tag,
	TagRelationToGame,
} from "juicer-shared";
import { Suspense, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
import { Footer } from "../../ui/components/Footer";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Input } from "../../ui/components/Input";
import { Main } from "../../ui/components/Main";
import { Nav } from "../../ui/components/Nav";
import { PageTemplate } from "../../ui/components/PageTemplate";
import { Option, Select } from "../../ui/components/Select";
import { Loading } from "../Loading/Loading";
export const GameSettings = () => {
	const { showToast } = useToast();
	const [isOnTransition, startTransition] = useLoading();
	const [searchParams] = useSearchParams();
	const gameId = searchParams.get("gameId");
	const serverId = searchParams.get("serverId");
	const _serverDataQuery = useSuspenseQuery(
		_fetchServerData.query(serverId as string),
	);
	const _serverData = _serverDataQuery.data;
	const rolesCombined = useMemo(() => {
		const dbRoles = _serverData.serverDataDb?.roles || [];
		const discordRoles = _serverData.serverDataDiscord.roles || [];

		// Role with roleCategory and selfAssignable
		const mergedRoles = dbRoles
			.map((dbRole) => {
				const discordRole = discordRoles.find(
					(discordRole) => discordRole.id === dbRole.roleId,
				);
				return {
					...dbRole,
					...discordRole,
					roleCategoryId: dbRole.roleCategoryId,
					selfAssignable: dbRole.selfAssignable,
				};
			})
			.filter((role) => role.name !== "@everyone"); // without @everyone

		return mergedRoles;
	}, [_serverData]);
	const gamesObj = useMemo(() => {
		return _serverData.serverDataDb?.games?.reduce(
			(obj, game) => {
				obj[game.gameId] = game;
				return obj;
			},
			{} as Record<number, Game>,
		);
	}, [_serverData]);
	const [selectedTags, setSelectedTags] = useState<number[]>(
		gamesObj?.[Number(gameId as string)]?.gamesTags?.map(
			(tag: TagRelationToGame) => tag.tagId,
		) || [],
	);
	const [selectedRoles, setSelectedRoles] = useState<string[]>(
		gamesObj?.[Number(gameId as string)]?.gamesRoles?.map(
			(role: RoleRelationToGame) => role.roleId,
		) || [],
	);
	const [selectedChannels, setSelectedChannels] = useState<string[]>(
		gamesObj?.[Number(gameId as string)]?.channels?.map(
			(channelId: string) => channelId,
		) || [],
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
					selectedChannels as string[],
				),
			);
			showToast("Game updated", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await startTransition(_serverDataQuery.refetch());
		navigate(`/server?serverId=${serverId}`);
	};

	const handleDeleteGame = async () => {
		// TODO do whatever when loading
		try {
			await startTransition(
				_deleteGame(serverId as string, Number(gameId as string)),
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

	const nav = (
		<Nav>
			<Button
				css={{ background: "none", alignItems: "center" }}
				onClick={() => navigate(`/server?serverId=${serverId}`)}
				type="button"
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
					{gamesObj?.[Number(gameId as string)]?.name}
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
		</Nav>
	);

	const footer = (
		<Footer>
			<Button
				css={{
					background: "#5865F2",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "100%",
					gap: "8px",
				}}
				loading={isOnTransition}
				disabled={isOnTransition}
				type="submit"
			>
				{isOnTransition ? "작업 중..." : "저장"}
			</Button>
		</Footer>
	);

	return (
		<Suspense fallback={<Loading />}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (isOnTransition) return;
					const formData = new FormData(e.currentTarget);
					onGameSettingsChangeSubmitAction(formData);
				}}
			>
				<PageTemplate nav={nav} footer={footer}>
					<Main
						css={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							flex: 1,
							maxHeight: "100%",
						}}
					>
						<label htmlFor="game-name">이름</label>
						<Input
							id="game-name"
							name="game-name"
							aria-required
							required
							defaultValue={gamesObj?.[Number(gameId as string)]?.name || ""}
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
								gamesObj?.[Number(gameId as string)]?.description || ""
							}
						/>
						<label htmlFor="game-category">카테고리 (선택)</label>
						<Select
							id="game-category"
							name="game-category"
							defaultValue={
								gamesObj?.[Number(gameId as string)]?.categoryId || ""
							}
						>
							<Option value="">카테고리 선택</Option>
							{_serverData.serverDataDb?.categories?.map(
								(category: Category) => (
									<Option key={category.categoryId} value={category.categoryId}>
										{category.name}
									</Option>
								),
							)}
						</Select>

						<label htmlFor="game-channels">채널 맵핑(선택)</label>
						<div
							css={{
								display: "flex",
								flexDirection: "row",
								gap: "6px",
								flexWrap: "wrap",
							}}
						>
							{_serverData.serverDataDiscord.channels?.map(
								(channel: ServerDataDiscordChannel) => {
									return (
										<CheckableChip
											key={channel.id}
											value={channel.id}
											checked={selectedChannels.includes(channel.id)}
											onChange={(checked) => {
												if (checked) {
													setSelectedChannels([
														...selectedChannels,
														channel.id,
													]);
												} else {
													setSelectedChannels(
														selectedChannels.filter((id) => id !== channel.id),
													);
												}
											}}
										>
											<TagIcon css={{ width: "16px", height: "16px" }} />
											{channel.name}
										</CheckableChip>
									);
								},
							)}
						</div>
						{_serverData.serverDataDb?.roles?.length === 0 && (
							<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
								서버에 역할이 없습니다.
							</div>
						)}

						<label htmlFor="game-tags">태그 부여(선택)</label>
						<div
							css={{
								display: "flex",
								flexDirection: "row",
								gap: "6px",
								flexWrap: "wrap",
							}}
						>
							{_serverData.serverDataDb?.tags?.map((tag: Tag) => (
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
						{_serverData.serverDataDb?.tags?.length === 0 && (
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
							{rolesCombined.map((role) => {
								return (
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
										disabled={!role.selfAssignable}
									>
										<_8pxCircle
											css={{
												backgroundColor: role.selfAssignable
													? role.color || "#ffffff"
													: "#999999",
											}}
										/>
										{role.name}
									</CheckableChip>
								);
							})}
						</div>
						{_serverData.serverDataDb?.roles?.length === 0 && (
							<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
								서버에 역할이 없습니다.
							</div>
						)}
					</Main>
				</PageTemplate>
			</form>
		</Suspense>
	);
};
