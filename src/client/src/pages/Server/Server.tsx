import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import { useQueries, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type {
	Category,
	Game,
	RoleRelationToGame,
	Tag,
	TagRelationToGame,
} from "juicer-shared";
import { Suspense, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import { _iHaveRole } from "../../functions/ServerFunctions";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useLoading } from "../../hooks/useLoading";
import { useToast } from "../../hooks/useToast";
import {
	_assignRoleByIdToUser,
	_createGame,
	_createServer,
	_fetchMyDataInServer,
	_fetchSearchGamesInServer,
	_fetchServerData,
	_fetchThumbnailsInGame,
	_syncServerData,
	_unassignRoleByIdFromUser,
} from "../../remotes/remotes";
import { LinkNoStyle } from "../../ui/components/Anchor";
import { Button, InlineButton } from "../../ui/components/Button";
import { Card, ResponsiveCard } from "../../ui/components/Card";
import { Chip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { GameCardSkeleton } from "../../ui/components/GameCardSkeleton";
import { Input } from "../../ui/components/Input";
import { Modal } from "../../ui/components/Modal";
import { ModalPortal } from "../../ui/components/ModalPortal";
import { RoleChip } from "../../ui/components/RoleChip";
import { Option, Select } from "../../ui/components/Select";
import { Skeleton } from "../../ui/components/Skeleton";
import { Loading } from "../Loading/Loading";

export const Server = () => {
	//TODO do whatever when loading
	const [query, setQuery] = useState<string | null>(null);
	const debouncedQuery = useDebouncedValue<string | null>(query, 300);
	// usages of isLoading to be added later
	const [isLoading, startTransition] = useLoading();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");
	const { showToast } = useToast();

	const _myDataInServerQuery = useSuspenseQuery({
		queryKey: ["myDataInServer", serverId],
		queryFn: () => _fetchMyDataInServer(serverId),
	});
	const _myDataInServer = _myDataInServerQuery.data;

	const _searchGamesInServerQuery = useQuery(
		_fetchSearchGamesInServer.query(serverId as string, debouncedQuery || null),
	);
	const _serverDataQuery = useSuspenseQuery(
		_fetchServerData.query(serverId as string),
	);
	const _serverData = _serverDataQuery.data;

	const rolesCombined = useMemo(() => {
		const dbRoles = _serverData.serverDataDb.roles || [];
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

		const mergedRolesObj: Record<string, (typeof mergedRoles)[number]> = {};
		mergedRoles.forEach((role) => {
			mergedRolesObj[role.roleId] = role;
		});

		return mergedRolesObj;
	}, [_serverData]);

	const categoriesObj = useMemo(() => {
		return _serverData.serverDataDb.categories?.reduce(
			(obj, category: Category) => {
				obj[category.categoryId] = category;
				return obj;
			},
			{} as Record<number, Category>,
		);
	}, [_serverData]);

	const tagsObj = useMemo(() => {
		return _serverData.serverDataDb.tags?.reduce(
			(obj, tag: Tag) => {
				obj[tag.tagId] = tag;
				return obj;
			},
			{} as Record<number, Tag>,
		);
	}, [_serverData]);

	const _gameThumbnailQueries = useQueries({
		queries: _fetchThumbnailsInGame.queries(
			serverId as string,
			_searchGamesInServerQuery.data?.map((game: Game) =>
				game.gameId.toString(),
			) || [],
		),
	});

	const createServerAction = async () => {
		try {
			await startTransition(_createServer(serverId as string));
			showToast("Server created", "success");
			await startTransition(_syncServerData(serverId as string));
			showToast("Roles synced with server", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
		await _searchGamesInServerQuery.refetch();
	};

	const toggleRoleAssign = async (roleId: string) => {
		try {
			if (_iHaveRole(_serverData, roleId)) {
				await startTransition(
					_unassignRoleByIdFromUser(serverId as string, roleId),
				);
				await startTransition(_myDataInServerQuery.refetch());
				showToast("Role unassigned", "success");
			} else {
				await startTransition(
					_assignRoleByIdToUser(serverId as string, roleId),
				);
				await startTransition(_myDataInServerQuery.refetch());
				showToast("Role assigned", "success");
			}
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
	};

	const syncServerDataAction = async () => {
		try {
			await startTransition(_syncServerData(serverId as string));
			showToast("Roles synced with server", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}

		await _serverDataQuery.refetch();
		await _searchGamesInServerQuery.refetch();
	};

	const addGameFormAction = async (formData: FormData) => {
		const gameName = formData.get("game-name");
		let gameDescription = formData.get("game-description");
		// null if ""
		if (gameDescription === "") {
			gameDescription = null;
		}
		let gameCategory = formData.get("game-category");
		if (gameCategory === "") {
			gameCategory = null;
		}
		console.log(gameName, gameDescription, gameCategory);
		try {
			await startTransition(
				_createGame(
					serverId as string,
					gameName as string,
					gameDescription as string | null | undefined,
					gameCategory as string | null | undefined,
				),
			);
			showToast("Game created", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
		await _searchGamesInServerQuery.refetch();
		setIsAddGameModalOpen(false);
	};

	const [isAddGameModalOpen, setIsAddGameModalOpen] = useState<boolean>(false);

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
							onClick={() => navigate("/")}
						>
							<ArrowBackIcon css={{ width: "24px", height: "24px" }} />
						</Button>
						<img
							src={_serverData.serverDataDiscord.icon || serverPlaceholderIcon}
							alt={_serverData.serverDataDiscord.name}
							css={{ width: "48px", height: "48px", borderRadius: "50%" }}
						/>
						<div
							css={{ display: "flex", flexDirection: "column", width: "100%" }}
						>
							<h1 css={{ margin: 0 }}>{_serverData.serverDataDiscord.name}</h1>
							<div>
								by {_serverData.serverDataDiscord.ownerName},{" "}
								{_serverData.serverDataDiscord.memberCount}명
							</div>
						</div>
						{_serverData.serverDataDb && (
							<div
								css={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									flexDirection: "row",
								}}
							>
								<Button
									css={{
										background: "#5865F2",
										display: "flex",
										alignItems: "center",
										gap: "8px",
									}}
									onClick={syncServerDataAction}
								>
									<SyncIcon css={{ width: "20px", height: "20px" }} />
								</Button>
								<Button
									css={{
										background: "rgba(255, 255, 255, 0.25)",
										display: "flex",
										alignItems: "center",
										gap: "8px",
									}}
									onClick={() =>
										navigate(`/server/settings?serverId=${serverId}`)
									}
								>
									<SettingsIcon css={{ width: "20px", height: "20px" }} />
								</Button>
							</div>
						)}
					</div>

					{
						<div
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<h2 css={{ margin: 0 }}>내 정보</h2>

							<Card
								css={{
									border: "none",
									display: "flex",
									flexDirection: "row",
									alignItems: "center",
									gap: "12px",
								}}
							>
								<img
									src={
										_myDataInServer.displayAvatarURL || serverPlaceholderIcon
									}
									alt={_myDataInServer.displayName}
									css={{ width: "48px", height: "48px", borderRadius: "50%" }}
								/>
								<div
									css={{ display: "flex", flexDirection: "column", gap: "4px" }}
								>
									<div
										css={{ display: "flex", flexDirection: "row", gap: "4px" }}
									>
										<h2 css={{ margin: 0 }}>{_myDataInServer.displayName}</h2>
									</div>
									<div
										css={{
											display: "flex",
											flexDirection: "row",
											gap: "4px",
											flexWrap: "wrap",
										}}
									>
										{_myDataInServer.roles.map((roleId: string) => {
											if (
												rolesCombined[roleId]?.name !== "@everyone" &&
												roleId !== (serverId as string)
											)
												return (
													<RoleChip
														key={roleId}
														name={
															rolesCombined[roleId]?.name ||
															`이름없음(ID ${roleId})`
														}
														color={rolesCombined[roleId]?.color || "#ffffff"}
													/>
												);
										})}
									</div>
								</div>
							</Card>
						</div>
					}
					<div
						css={{
							display: "flex",
							flexDirection: "row",
							gap: "12px",
							alignItems: "center",
						}}
					>
						<h2 css={{ margin: 0, flex: 1 }}>주제</h2>
						<Input
							placeholder="이름/카테고리/태그 검색"
							value={query || ""}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>

					{_searchGamesInServerQuery.isLoading && (
						<div
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<GameCardSkeleton />
							<GameCardSkeleton />
							<GameCardSkeleton />
						</div>
					)}

					{_searchGamesInServerQuery?.data &&
						!!_searchGamesInServerQuery?.data?.length === false &&
						query && <div>검색 결과가 없습니다.</div>}

					{_searchGamesInServerQuery?.data &&
						!!_searchGamesInServerQuery?.data?.length === false &&
						!query && <div>주제가 없습니다.</div>}

					{_searchGamesInServerQuery?.data &&
						!!_searchGamesInServerQuery?.data?.length === true && (
							<div
								css={{
									display: "flex",
									flexDirection: "column",
									gap: "12px",
								}}
							>
								{_searchGamesInServerQuery?.data?.map(
									(game: Game, idx: number) => {
										return (
											<Card
												css={{
													border: "1px solid rgb(255, 255, 255)",
													alignItems: "center",
													display: "flex",
													flexDirection: "row",
												}}
												key={game.gameId}
											>
												{_gameThumbnailQueries[idx].isLoading ? (
													<Skeleton css={{ width: "64px", height: "64px" }} />
												) : (
													<img
														src={
															_gameThumbnailQueries[idx].data ||
															serverPlaceholderIcon
														}
														alt={game.name}
														css={{
															width: "64px",
															height: "64px",
															borderRadius: "16px",
														}}
													/>
												)}
												<div
													css={{
														display: "flex",
														flexDirection: "row",
														gap: "8px",
														width: "100%",
														alignItems: "stretch",
													}}
												>
													<div
														css={{
															display: "flex",
															flexDirection: "column",
															width: "100%",
															gap: "4px",
															flex: 1,
														}}
													>
														<div
															css={{
																display: "flex",
																flexDirection: "row",
																gap: "4px",
															}}
														>
															<h2 css={{ margin: 0, display: "inline" }}>
																{game.name}
															</h2>
															<div
																css={{
																	display: "flex",
																	flexDirection: "row",
																	gap: "4px",
																	alignItems: "center",
																}}
															>
																{game.categoryId
																	? categoriesObj?.[game.categoryId]?.name ||
																		"카테고리 이름 없음"
																	: "카테고리 없음"}
															</div>
														</div>
														<div
															css={{
																display: "flex",
																flexDirection: "row",
																gap: "4px",
																flexWrap: "wrap",
															}}
														>
															{game.gamesTags &&
																game.gamesTags.length > 0 &&
																game.gamesTags?.map(
																	(tag: TagRelationToGame) => (
																		<div
																			key={tag.tagId}
																			css={{
																				display: "flex",
																				flexDirection: "row",
																				gap: "4px",
																				alignItems: "center",
																				border: "none",
																				background: "none",
																			}}
																		>
																			#
																			{tagsObj?.[tag.tagId]?.name ||
																				"태그 이름 없음"}
																		</div>
																	),
																)}
														</div>
														<div
															css={{
																display: "flex",
																flexDirection: "row",
																gap: "4px",
																flexWrap: "wrap",
															}}
														>
															{game.gamesRoles &&
																game.gamesRoles.length > 0 &&
																game.gamesRoles.map(
																	(role: RoleRelationToGame) => (
																		<Chip
																			key={role.roleId}
																			css={{
																				display: "flex",
																				flexDirection: "row",
																				gap: "4px",
																				alignItems: "center",
																				cursor: "pointer",
																				...(_iHaveRole(
																					_serverData,
																					role.roleId,
																				) && {
																					border: "1px solid black",
																					background: "rgba(255, 255, 255, 1)",
																					color: "rgba(0, 0, 0, 1)",
																				}),
																			}}
																			onClick={() =>
																				toggleRoleAssign(role.roleId)
																			}
																		>
																			<_8pxCircle
																				css={{
																					backgroundColor: `${
																						rolesCombined[role.roleId]?.color ||
																						"#ffffff"
																					}`,
																				}}
																			/>
																			{rolesCombined[role.roleId]?.name ||
																				"역할 이름 없음"}
																		</Chip>
																	),
																)}
														</div>
													</div>
													{_serverData.admin && (
														<div css={{ alignSelf: "stretch" }}>
															<LinkNoStyle
																to={`/server/game?gameId=${game.gameId}&serverId=${serverId}`}
																css={{ cursor: "pointer" }}
															>
																<InlineButton
																	css={{ height: "100%", alignItems: "center" }}
																>
																	<SettingsIcon
																		css={{ width: "20px", height: "20px" }}
																	/>
																</InlineButton>
															</LinkNoStyle>
														</div>
													)}
												</div>
											</Card>
										);
									},
								)}
							</div>
						)}
					{_serverData.serverDataDb && _serverData.admin && (
						<Card
							css={{
								border: "1px solid rgba(255, 255, 255, 0.66)",
								alignItems: "center",
								cursor: "pointer",
								display: "flex",
								flexDirection: "row",
							}}
							onClick={() => setIsAddGameModalOpen(true)}
						>
							<AddIcon css={{ width: "16px", height: "16px" }} />
							주제 추가하기
						</Card>
					)}

					{!_serverData.serverDataDb && (
						<div
							css={{
								display: "flex",
								flexDirection: "column",
								gap: "12px",
								alignItems: "center",
							}}
						>
							<div>
								서버 데이터가 없습니다. juicer DB에 서버를 추가해 주세요.
							</div>
							<Button
								css={{
									background: "#5865F2",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "8px",
								}}
								onClick={createServerAction}
							>
								<AddIcon css={{ width: "16px", height: "16px" }} />
								juicer DB에 서버 추가
							</Button>
						</div>
					)}
				</ResponsiveCard>
			</FullPageBase>
			{isAddGameModalOpen && (
				<ModalPortal>
					<Modal title="주제 추가" onClose={() => setIsAddGameModalOpen(false)}>
						<form
							action={addGameFormAction}
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<label htmlFor="game-name">이름</label>
							<Input id="game-name" name="game-name" aria-required required />
							<label htmlFor="game-description">설명 (선택)</label>
							<Input id="game-description" name="game-description" />
							<label htmlFor="game-category">카테고리 (선택)</label>
							<Select id="game-category" name="game-category" defaultValue="">
								<Option value="">카테고리 선택</Option>
								{_serverData.serverDataDb.categories?.map(
									(category: Category) => (
										<Option
											key={category.categoryId}
											value={category.categoryId}
										>
											{category.name}
										</Option>
									),
								)}
							</Select>
							<div>태그와 역할은 생성 후 추가할 수 있습니다.</div>
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
								주제 추가
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
		</Suspense>
	);
};
