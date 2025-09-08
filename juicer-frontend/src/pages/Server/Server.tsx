import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import {
	QueryClient,
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import {
	Link,
	useActionData,
	useNavigate,
	useSearchParams,
} from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import {
	_createGame,
	_createServer,
	_fetchMyDataInServer,
	_fetchServerData,
} from "../../queries/queries";
import type {
	Category,
	Game,
	Role,
	ServerDataDiscordRole,
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
import { Loading } from "../Loading/Loading";
export const Server = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");
	const queryClient = useQueryClient();

	const _findRoleById = (roleId: string): ServerDataDiscordRole | undefined => {
		return _serverData.data?.server_data_discord.roles?.find(
			(r: ServerDataDiscordRole) => r.id === roleId,
		);
	};

	const _iHaveAllRolesInTheGame = (game: Game): boolean => {
		return (
			game.roles_to_add?.every(
				(role: Role) => _findRoleById(role.id)?.me_in_role,
			) || false
		);
	};

	const _myDataInServer = useSuspenseQuery({
		queryKey: ["myDataInServer", serverId],
		queryFn: () => _fetchMyDataInServer(serverId),
	});

	const _serverData = useSuspenseQuery({
		queryKey: ["serverData", serverId],
		queryFn: () => _fetchServerData(serverId),
	});

	const createServerMutation = useMutation({
		mutationFn: (serverId: string) => _createServer(serverId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["serverData", serverId] });
		},
		onError: (error) => {
			console.error(error);
		},
	});

	const createGameMutation = useMutation({
		mutationFn: ({
			serverId,
			gameName,
			gameDescription,
			gameCategory,
		}: {
			serverId: string;
			gameName: string;
			gameDescription: string | null | undefined;
			gameCategory: string | null | undefined;
		}) => _createGame(serverId, gameName, gameDescription, gameCategory),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["serverData", serverId] });
		},
		onError: (error) => {
			console.error(error);
		},
	});

	useEffect(() => {
		console.log(_serverData.data);
		console.log(_myDataInServer.data);
	}, [_serverData.data, _myDataInServer.data]);

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
		createGameMutation.mutate({
			serverId: serverId as string,
			gameName: gameName as string,
			gameDescription: gameDescription as string | null | undefined,
			gameCategory: gameCategory as string | null | undefined,
		});
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
								_serverData.data?.server_data_discord.icon ||
								serverPlaceholderIcon
							}
							alt={_serverData.data?.server_data_discord.name}
							css={{ width: "48px", height: "48px", borderRadius: "50%" }}
						/>
						<div
							css={{ display: "flex", flexDirection: "column", width: "100%" }}
						>
							<h1 css={{ margin: 0 }}>
								{_serverData.data?.server_data_discord.name}
							</h1>
							<div>
								by {_serverData.data?.server_data_discord.owner_name},{" "}
								{_serverData.data?.server_data_discord.member_count}명
							</div>
						</div>
						{_serverData.data?.server_data_db && (
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
									src={_myDataInServer.data?.avatar || serverPlaceholderIcon}
									alt={_myDataInServer.data?.name}
									css={{ width: "48px", height: "48px", borderRadius: "50%" }}
								/>
								<div
									css={{ display: "flex", flexDirection: "column", gap: "4px" }}
								>
									<div
										css={{ display: "flex", flexDirection: "row", gap: "4px" }}
									>
										<h2 css={{ margin: 0 }}>
											{_myDataInServer.data?.nick
												? _myDataInServer.data.nick
												: _myDataInServer.data?.name}
										</h2>
									</div>
									<div
										css={{ display: "flex", flexDirection: "row", gap: "4px" }}
									>
										{_myDataInServer.data?.roles?.map((role: Role) => {
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
																_findRoleById(role.id)?.color.join(",") ||
																"255, 255, 255"
															})`,
														}}
													/>
													{_findRoleById(role.id)?.name}
												</Chip>
											);
										})}
									</div>
								</div>
							</Card>
						</div>
					}

					{_serverData.data?.server_data_db.games &&
						_serverData.data?.server_data_db.games.length > 0 && (
							<div
								css={{ display: "flex", flexDirection: "column", gap: "12px" }}
							>
								<h2 css={{ margin: 0 }}>게임</h2>
								{_serverData.data.server_data_db.games.map((game: Game) => (
									<Card
										css={{
											border: "1px solid rgb(255, 255, 255)",
											alignItems: "center",
											display: "flex",
											flexDirection: "row",
											...(_iHaveAllRolesInTheGame(game) && {
												backgroundColor: "rgba(255, 255, 255, 1)",
												color: "rgba(0, 0, 0, 1)",
											}), // NEEDS TO BE TESTED
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
											<LinkNoStyle
												to={null as any}
												css={{ flex: 1, cursor: "pointer" }}
											>
												<div
													css={{
														display: "flex",
														flexDirection: "column",
														width: "100%",
														gap: "4px",
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
															{game.category && game.category.length > 0
																? game.category
																		?.map((category: Category) => category.name)
																		.join(", ")
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
																	<Chip
																		key={tag.id}
																		css={{
																			display: "flex",
																			flexDirection: "row",
																			gap: "4px",
																			alignItems: "center",
																		}}
																	>
																		{tag.name}
																	</Chip>
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
															? game.roles_to_add?.map((role: Role) => (
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
																					_findRoleById(role.id)?.color.join(
																						",",
																					) || "255, 255, 255"
																				})`,
																			}}
																		/>
																		{_findRoleById(role.id)?.name}
																	</Chip>
																))
															: "역할 없음"}
													</div>
												</div>
											</LinkNoStyle>
											{_serverData.data?.admin && (
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
								))}
							</div>
						)}

					{_serverData.data?.server_data_db && _serverData.data.admin && (
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

					{!_serverData.data?.server_data_db && (
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
								onClick={() => createServerMutation.mutate(serverId as string)}
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
								{_serverData.data?.server_data_db.categories?.map(
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
