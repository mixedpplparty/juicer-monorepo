import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import {
	_findRoleById,
	_iHaveAllRolesInTheGame,
	filterOutEveryoneRole,
} from "../../functions/ServerFunctions";
import { useLoading } from "../../hooks/useLoading";
import { useToast } from "../../hooks/useToast";
import {
	_assignRolesToUser,
	_createGame,
	_createServer,
	_fetchMyDataInServer,
	_fetchSearchGamesInServer,
	_fetchServerData,
	_syncServerData,
	_unassignRolesFromUser,
} from "../../remotes/remotes";
import type {
	Category,
	Game,
	MyDataInServer,
	Role,
	ServerData,
	Tag,
} from "../../types/types";
import { LinkNoStyle } from "../../ui/components/Anchor";
import { Button, InlineButton } from "../../ui/components/Button";
import { Card, ResponsiveCard } from "../../ui/components/Card";
import { Chip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Input } from "../../ui/components/Input";
import { Modal } from "../../ui/components/Modal";
import { ModalPortal } from "../../ui/components/ModalPortal";
import { Option, Select } from "../../ui/components/Select";
import { Skeleton } from "../../ui/components/Skeleton";
import { Loading } from "../Loading/Loading";

const GameCardSkeleton = () => {
	return (
		<Card
			css={{
				border: "1px solid rgba(255, 255, 255, 0.33)",
				display: "flex",
				flexDirection: "column",
				gap: "12px",
			}}
		>
			<div
				css={{
					display: "flex",
					flexDirection: "row",
					gap: "8px",
					alignItems: "center",
				}}
			>
				<Skeleton css={{ width: "25%", height: "1.5rem" }} />
				<Skeleton css={{ width: "10%", height: "1rem" }} />
			</div>
			<Skeleton css={{ width: "35%", height: "1rem" }} />
			<div css={{ display: "flex", flexDirection: "row", gap: "4px" }}>
				<Skeleton css={{ width: "10%", height: "1rem" }} />
				<Skeleton css={{ width: "10%", height: "1rem" }} />
				<Skeleton css={{ width: "10%", height: "1rem" }} />
			</div>
		</Card>
	);
};

export const Server = () => {
	//TODO do whatever when loading
	const [query, setQuery] = useState<string | null>(null);
	const [isLoading, startTransition] = useLoading();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");
	const { showToast } = useToast();

	const _myDataInServerQuery = useSuspenseQuery({
		queryKey: ["myDataInServer", serverId],
		queryFn: () => _fetchMyDataInServer(serverId),
	});
	const _myDataInServer = _myDataInServerQuery.data as MyDataInServer;

	const _searchGamesInServerQuery = useQuery(
		_fetchSearchGamesInServer.query(serverId as string, query || null),
	);

	const _serverDataQuery = useSuspenseQuery(
		_fetchServerData.query(serverId as string),
	);
	const _serverData = _serverDataQuery.data.data as ServerData;

	const createServerAction = async () => {
		try {
			await startTransition(_createServer(serverId as string));
			showToast("Server created", "success");
		} catch (error) {
			showToast(error.response.data.detail, "error");
		}
		await _serverDataQuery.refetch();
	};

	const toggleGameRolesAssign = async (game: Game) => {
		try {
			if (_iHaveAllRolesInTheGame(_serverData, game)) {
				await startTransition(
					_unassignRolesFromUser(serverId as string, game.id),
				);
				showToast("Roles unassigned", "success");
			} else {
				await startTransition(_assignRolesToUser(serverId as string, game.id));
				showToast("Roles assigned", "success");
			}
		} catch (error) {
			showToast(error.response.data.detail, "error");
		}

		await _serverDataQuery.refetch();
	};

	const syncServerDataAction = async () => {
		try {
			await startTransition(_syncServerData(serverId as string));
			showToast("Roles synced with server", "success");
		} catch (error) {
			showToast(error.response.data.detail, "error");
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
		} catch (error) {
			showToast(error.response.data.detail, "error");
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
							src={
								_serverData.server_data_discord.icon || serverPlaceholderIcon
							}
							alt={_serverData.server_data_discord.name}
							css={{ width: "48px", height: "48px", borderRadius: "50%" }}
						/>
						<div
							css={{ display: "flex", flexDirection: "column", width: "100%" }}
						>
							<h1 css={{ margin: 0 }}>
								{_serverData.server_data_discord.name}
							</h1>
							<div>
								by {_serverData.server_data_discord.owner_name},{" "}
								{_serverData.server_data_discord.member_count}명
							</div>
						</div>
						{_serverData.server_data_db && (
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
									src={_myDataInServer.avatar || serverPlaceholderIcon}
									alt={_myDataInServer.name}
									css={{ width: "48px", height: "48px", borderRadius: "50%" }}
								/>
								<div
									css={{ display: "flex", flexDirection: "column", gap: "4px" }}
								>
									<div
										css={{ display: "flex", flexDirection: "row", gap: "4px" }}
									>
										<h2 css={{ margin: 0 }}>
											{_myDataInServer.nick
												? _myDataInServer.nick
												: _myDataInServer.name}
										</h2>
									</div>
									<div
										css={{ display: "flex", flexDirection: "row", gap: "4px" }}
									>
										{filterOutEveryoneRole(
											_serverData,
											_myDataInServer.roles || [],
										).map((role: Role) => {
											return (
												<Chip
													key={role.id}
													css={{
														display: "flex",
														flexDirection: "row",
														gap: "4px",
														alignItems: "center",
													}}
												>
													<_8pxCircle
														css={{
															backgroundColor: `rgb(${
																_findRoleById(_serverData, role.id)?.color.join(
																	",",
																) || "255, 255, 255"
															})`,
														}}
													/>
													{_findRoleById(_serverData, role.id)?.name}
												</Chip>
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
						<h2 css={{ margin: 0, flex: 1 }}>게임</h2>
						<Input
							placeholder="게임 이름 검색"
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
						!!_searchGamesInServerQuery?.data?.data?.length === false &&
						query && <div>검색 결과가 없습니다.</div>}

					{_searchGamesInServerQuery?.data &&
						!!_searchGamesInServerQuery?.data?.data?.length === false &&
						!query && <div>게임이 없습니다.</div>}

					{_searchGamesInServerQuery?.data &&
						!!_searchGamesInServerQuery?.data?.data?.length === true && (
							<div
								css={{
									display: "flex",
									flexDirection: "column",
									gap: "12px",
								}}
							>
								{_searchGamesInServerQuery?.data?.data?.map((game: Game) => {
									return (
										<Card
											css={{
												border: "1px solid rgb(255, 255, 255)",
												alignItems: "center",
												display: "flex",
												flexDirection: "row",
												...(_iHaveAllRolesInTheGame(_serverData, game) && {
													backgroundColor: "rgba(255, 255, 255, 1)",
													color: "rgba(0, 0, 0, 1)",
												}),
											}}
											key={game.id}
										>
											<div
												css={{
													display: "flex",
													flexDirection: "row",
													gap: "8px",
													width: "100%",
													alignItems: "stretch",
												}}
											>
												<InlineButton
													css={{
														display: "flex",
														flexDirection: "column",
														width: "100%",
														gap: "4px",
														flex: 1,
														cursor: "pointer",
													}}
													onClick={() => toggleGameRolesAssign(game)}
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
															{game.category
																? game.category.name
																: "카테고리 없음"}
														</div>
													</div>
													<div
														css={{
															display: "flex",
															flexDirection: "row",
															gap: "4px",
														}}
													>
														{game.tags && game.tags.length > 0
															? game.tags?.map((tag: Tag) => (
																	<div
																		key={tag.id}
																		css={{
																			display: "flex",
																			flexDirection: "row",
																			gap: "4px",
																			alignItems: "center",
																			border: "none",
																			background: "none",
																		}}
																	>
																		#{tag.name}
																	</div>
																))
															: "태그 없음"}
													</div>
													<div
														css={{
															display: "flex",
															flexDirection: "row",
															gap: "4px",
														}}
													>
														{game.roles_to_add && game.roles_to_add.length > 0
															? filterOutEveryoneRole(
																	_serverData,
																	game.roles_to_add,
																)?.map((role: Role) => (
																	<Chip
																		key={role.id}
																		css={{
																			display: "flex",
																			flexDirection: "row",
																			gap: "4px",
																			alignItems: "center",
																			...(_iHaveAllRolesInTheGame(
																				_serverData,
																				game,
																			) && {
																				border: "1px solid black",
																			}),
																		}}
																	>
																		<_8pxCircle
																			css={{
																				backgroundColor: `rgb(${
																					_findRoleById(
																						_serverData,
																						role.id,
																					)?.color.join(",") || "255, 255, 255"
																				})`,
																			}}
																		/>
																		{_findRoleById(_serverData, role.id)?.name}
																	</Chip>
																))
															: "역할 없음"}
													</div>
												</InlineButton>
												{_serverData.admin && (
													<div css={{ alignSelf: "stretch" }}>
														<LinkNoStyle
															to={`/server/game?gameId=${game.id}&serverId=${serverId}`}
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
								})}
							</div>
						)}
					{_serverData.server_data_db && _serverData.admin && (
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
							게임 추가하기
						</Card>
					)}

					{!_serverData.server_data_db && (
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
					<Modal title="게임 추가" onClose={() => setIsAddGameModalOpen(false)}>
						<form
							action={addGameFormAction}
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<label htmlFor="game-name">게임 이름</label>
							<Input id="game-name" name="game-name" aria-required required />
							<label htmlFor="game-description">설명 (선택)</label>
							<Input id="game-description" name="game-description" />
							<label htmlFor="game-category">카테고리 (선택)</label>
							<Select id="game-category" name="game-category" defaultValue="">
								<Option value="">카테고리 선택</Option>
								{_serverData.server_data_db.categories?.map(
									(category: Category) => (
										<Option key={category.id} value={category.id}>
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
								게임 추가
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
		</Suspense>
	);
};
