import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import { useQueries, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type {
	Category,
	Game,
	RoleCategory,
	RoleRelationToGame,
	ServerDataDiscordChannel,
	Tag,
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
import { Card } from "../../ui/components/Card";
import { Chip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { GameCardSkeleton } from "../../ui/components/GameCardSkeleton";
import { Input } from "../../ui/components/Input";
import { Modal } from "../../ui/components/Modal";
import { ModalPortal } from "../../ui/components/ModalPortal";
import { Nav } from "../../ui/components/Nav";
import { PageTemplate } from "../../ui/components/PageTemplate";
import { RoleChip } from "../../ui/components/RoleChip";
import { Option, Select } from "../../ui/components/Select";
import { Skeleton } from "../../ui/components/Skeleton";
import { Loading } from "../Loading/Loading";

export const Server = () => {
	const [query, setQuery] = useState<string | null>(null);
	const debouncedQuery = useDebouncedValue<string | null>(query, 300);
	const [areMyRolesSorted, setAreMyRolesSorted] = useState<boolean>(true);
	const [isOnTransition, startTransition] = useLoading();
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

	const roleCategoriesObj = useMemo(() => {
		return _serverData.serverDataDb?.roleCategories?.reduce(
			(obj, roleCategory) => {
				obj[roleCategory.roleCategoryId] = roleCategory;
				return obj;
			},
			{} as Record<number, RoleCategory>,
		);
	}, [_serverData]);

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
					roleCategoryName: dbRole.roleCategoryId
						? roleCategoriesObj?.[dbRole.roleCategoryId]?.name
						: null,
					selfAssignable: dbRole.selfAssignable,
				};
			})
			.filter((role) => role.name !== "@everyone"); // without @everyone

		const mergedRolesObj: Record<string, (typeof mergedRoles)[number]> = {};
		mergedRoles.forEach((role) => {
			mergedRolesObj[role.roleId] = role;
		});

		return mergedRolesObj;
	}, [_serverData, roleCategoriesObj]);

	const categoriesObj = useMemo(() => {
		return _serverData.serverDataDb?.categories?.reduce(
			(obj, category: Category) => {
				obj[category.categoryId] = category;
				return obj;
			},
			{} as Record<number, Category>,
		);
	}, [_serverData]);

	const channelsObj = useMemo(() => {
		return _serverData.serverDataDiscord.channels?.reduce(
			(obj, channel: ServerDataDiscordChannel) => {
				obj[channel.id] = channel;
				return obj;
			},
			{} as Record<string, ServerDataDiscordChannel>,
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

	const iAmVerified = useMemo(() => {
		// if verification is not required, I am verified
		if (!_serverData.serverDataDb?.verificationRequired) {
			return true;
		}
		// if verification is required, check if I have the verification role
		for (const role of Object.values(rolesCombined)) {
			if (role.roleCategoryId === 1 && !_iHaveRole(_serverData, role.roleId)) {
				// verification role category is always ID 1
				return false;
			}
		}
		return true;
	}, [_serverData, rolesCombined]);

	const createServerAction = async () => {
		try {
			await startTransition(_createServer(serverId as string));
			showToast("Server created", "success");
			await startTransition(_syncServerData(serverId as string));
			showToast("Roles synced with server", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				if (error.response?.data?.detail) {
					showToast(error.response?.data.detail as string, "error");
				} else {
					showToast(error.response?.data as string, "error");
				}
			}
		}
		await startTransition(_serverDataQuery.refetch());
		await startTransition(_searchGamesInServerQuery.refetch());
	};

	const syncServerDataAction = async () => {
		try {
			await startTransition(_syncServerData(serverId as string));
			showToast("Roles synced with server", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				if (error.response?.data?.detail) {
					showToast(error.response?.data.detail as string, "error");
				} else {
					showToast(error.response?.data as string, "error");
				}
			}
		}

		await startTransition(_serverDataQuery.refetch());
		await startTransition(_searchGamesInServerQuery.refetch());
	};

	const addGameFormAction = async (formData: FormData) => {
		const gameName = formData.get("game-name");
		let gameDescription = formData.get("game-description");
		// null if ""
		if (gameDescription === "") {
			gameDescription = null;
		}
		let gameCategory = formData.get("game-category");
		if (gameCategory === "" || gameCategory === null || gameCategory === "0") {
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
		await startTransition(_serverDataQuery.refetch());
		await startTransition(_searchGamesInServerQuery.refetch());
		setIsAddGameModalOpen(false);
	};

	const [isAddGameModalOpen, setIsAddGameModalOpen] = useState<boolean>(false);

	const nav = (
		<Nav
			css={{
				flexWrap: "wrap",
			}}
		>
			<div
				css={{
					display: "flex",
					flexDirection: "row",
					gap: "inherit",
					alignItems: "center",
					flex: "1",
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
					css={{
						display: "flex",
						flexDirection: "column",
						width: "100%",
						flex: 1,
					}}
				>
					<h1 css={{ margin: 0 }}>{_serverData.serverDataDiscord.name}</h1>
					<div>
						by {_serverData.serverDataDiscord.ownerName},{" "}
						{_serverData.serverDataDiscord.memberCount}명
					</div>
				</div>
			</div>
			{_serverData.serverDataDb && _serverData.admin && (
				<div
					css={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						flexDirection: "row",
						flexShrink: 0,
						marginLeft: "auto",
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
						onClick={() => navigate(`/server/settings?serverId=${serverId}`)}
					>
						<SettingsIcon css={{ width: "20px", height: "20px" }} />
					</Button>
				</div>
			)}
		</Nav>
	);

	return (
		<Suspense fallback={<Loading />}>
			<PageTemplate nav={nav}>
				{
					<div css={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
							<div
								css={{
									display: "flex",
									flexDirection: "column",
									gap: "16px",
									flex: 1,
								}}
							>
								<div
									css={{
										display: "flex",
										flexDirection: "row",
										gap: "12px",
										alignItems: "center",
									}}
								>
									<img
										src={
											_myDataInServer.displayAvatarURL || serverPlaceholderIcon
										}
										alt={_myDataInServer.displayName}
										css={{ width: "36px", height: "36px", borderRadius: "50%" }}
									/>
									<h2 css={{ margin: 0, flex: 1 }}>
										{_myDataInServer.displayName}
									</h2>
									<Chip
										css={{
											display: "flex",
											alignItems: "center",
											cursor: "pointer",
										}}
										onClick={() => setAreMyRolesSorted(!areMyRolesSorted)}
									>
										{areMyRolesSorted ? (
											<FilterAltOffIcon
												css={{ width: "16px", height: "16px" }}
											/>
										) : (
											<FilterAltIcon css={{ width: "16px", height: "16px" }} />
										)}
									</Chip>
								</div>
								<div>
									{!areMyRolesSorted ? (
										<div
											css={{
												display: "flex",
												flexDirection: "row",
												gap: "4px",
												flexWrap: "wrap",
											}}
										>
											{_myDataInServer.roles.map((role: string) => {
												if (role !== serverId) {
													return (
														<RoleChip
															variant="unclickable"
															key={role}
															name={
																rolesCombined[role]?.name ||
																`이름없음 (ID ${role})`
															}
															color={rolesCombined[role]?.color || "#ffffff"}
														/>
													);
												}
											})}
										</div>
									) : (
										<div
											css={{
												display: "flex",
												flexDirection: "column",
												gap: "12px",
											}}
										>
											{_serverData.serverDataDb?.roleCategories?.map(
												(roleCategory: RoleCategory) => {
													if (
														_myDataInServer.roles.filter((roleId: string) => {
															return (
																rolesCombined[roleId]?.roleCategoryId ===
																roleCategory.roleCategoryId
															);
														}).length > 0
													) {
														return (
															<div
																key={roleCategory.roleCategoryId}
																css={{
																	display: "flex",
																	flexDirection: "column",
																	gap: "4px",
																}}
															>
																<h3 css={{ margin: 0, fontWeight: 500 }}>
																	{roleCategory.name}
																</h3>
																<div
																	css={{
																		display: "flex",
																		flexDirection: "row",
																		gap: "4px",
																		flexWrap: "wrap",
																	}}
																>
																	{_myDataInServer.roles
																		.filter((roleId: string) => {
																			return (
																				rolesCombined[roleId]
																					?.roleCategoryId ===
																				roleCategory.roleCategoryId
																			);
																		})
																		.map((role: string) => {
																			return (
																				<RoleChip
																					variant="unclickable"
																					key={role}
																					name={
																						rolesCombined[role]?.name ||
																						`이름없음 (ID ${role})`
																					}
																					color={
																						rolesCombined[role]?.color ||
																						"#ffffff"
																					}
																				/>
																			);
																		})}
																</div>
															</div>
														);
													}
												},
											)}
											<div
												css={{
													display: "flex",
													flexDirection: "column",
													gap: "4px",
												}}
											>
												<h3 css={{ margin: 0, fontWeight: 500 }}>미분류</h3>
												<div
													css={{
														display: "flex",
														flexDirection: "row",
														gap: "4px",
														flexWrap: "wrap",
													}}
												>
													{_myDataInServer.roles
														.filter((roleId: string) => {
															return (
																rolesCombined[roleId]?.roleCategoryId === null
															);
														})
														.map((role: string) => {
															return (
																<RoleChip
																	variant="unclickable"
																	key={role}
																	name={
																		rolesCombined[role]?.name ||
																		`이름없음 (ID ${role})`
																	}
																	color={
																		rolesCombined[role]?.color || "#ffffff"
																	}
																/>
															);
														})}
												</div>
												<div css={{ display: "flex" }}>
													<div />
												</div>
											</div>
										</div>
									)}
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
					{iAmVerified && (
						<Input
							placeholder="이름/카테고리/태그 검색"
							value={query || ""}
							onChange={(e) => setQuery(e.target.value)}
						/>
					)}
				</div>

				{_searchGamesInServerQuery.isLoading && iAmVerified && (
					<div css={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<GameCardSkeleton />
						<GameCardSkeleton />
						<GameCardSkeleton />
					</div>
				)}

				{_searchGamesInServerQuery?.data &&
					!!_searchGamesInServerQuery?.data?.length === false &&
					query &&
					iAmVerified && <div>검색 결과가 없습니다.</div>}

				{!iAmVerified && <div>서버 이용을 위한 인증이 필요합니다.</div>}

				{_searchGamesInServerQuery?.data &&
					!!_searchGamesInServerQuery?.data?.length === false &&
					iAmVerified &&
					!query && <div>주제가 없습니다.</div>}

				{_searchGamesInServerQuery?.data &&
					!!_searchGamesInServerQuery?.data?.length === true &&
					iAmVerified && (
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
										<LinkNoStyle
											to={`/server/game?gameId=${game.gameId}&serverId=${serverId}`}
											css={{ cursor: "pointer" }}
											key={game.gameId}
										>
											<Card
												css={{
													border: "1px solid rgb(255, 255, 255)",
													alignItems: "center",
													display: "flex",
													flexDirection: "row",
												}}
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
																{game.categoryId &&
																	(categoriesObj?.[game.categoryId]?.name ||
																		"카테고리 이름 없음")}
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
															{game.channels &&
																game.channels.length > 0 &&
																game.channels.map((channelId: string) => (
																	<div
																		css={{
																			display: "flex",
																			flexDirection: "row",
																			gap: "4px",
																			alignItems: "center",
																		}}
																		key={channelId}
																	>
																		#
																		{channelsObj?.[channelId]?.name ||
																			"채널 이름 없음"}
																	</div>
																))}
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
																				...(_iHaveRole(
																					_serverData,
																					role.roleId,
																				) && {
																					border: "1px solid black",
																					background: "rgba(255, 255, 255, 1)",
																					color: "rgba(0, 0, 0, 1)",
																				}),
																				...(isOnTransition && {
																					opacity: "0.5",
																					cursor: "not-allowed",
																				}),
																			}}
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
																to={`/server/game/settings?gameId=${game.gameId}&serverId=${serverId}`}
																css={{ cursor: "pointer" }}
															>
																<InlineButton
																	css={{
																		height: "100%",
																		alignItems: "center",
																	}}
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
										</LinkNoStyle>
									);
								},
							)}
						</div>
					)}
				{_serverData.serverDataDb && _serverData.admin && iAmVerified && (
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
						<div>서버 데이터가 없습니다. juicer DB에 서버를 추가해 주세요.</div>
						<Button
							css={{
								background: "#5865F2",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: "8px",
								...(isOnTransition && {
									opacity: "0.5",
									cursor: "not-allowed",
								}),
							}}
							onClick={isOnTransition ? undefined : createServerAction}
						>
							<AddIcon css={{ width: "16px", height: "16px" }} />
							juicer DB에 서버 추가
						</Button>
					</div>
				)}
				<div></div>
			</PageTemplate>
			{isAddGameModalOpen && (
				<ModalPortal>
					<Modal title="주제 추가" onClose={() => setIsAddGameModalOpen(false)}>
						<form
							onSubmit={async (e) => {
								e.preventDefault(); // prevent reload
								if (isOnTransition) return;
								const formData = new FormData(e.currentTarget);
								await addGameFormAction(formData);
							}}
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<label htmlFor="game-name">이름</label>
							<Input id="game-name" name="game-name" aria-required required />
							<label htmlFor="game-description">설명 (선택)</label>
							<Input id="game-description" name="game-description" />
							<label htmlFor="game-category">카테고리 (선택)</label>
							<Select id="game-category" name="game-category" defaultValue="">
								<Option value="">카테고리 선택</Option>
								{_serverData.serverDataDb?.categories?.map(
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
								disabled={isOnTransition}
								loading={isOnTransition}
								type="submit"
							>
								{isOnTransition ? "작업 중..." : "주제 추가"}
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
		</Suspense>
	);
};
