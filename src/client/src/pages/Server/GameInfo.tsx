import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type {
	Category,
	RoleRelationToGame,
	ServerDataDiscordChannel,
	Tag,
} from "juicer-shared";
import { Suspense, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import { _iHaveRole } from "../../functions/ServerFunctions";
import { useLoading } from "../../hooks/useLoading";
import { useToast } from "../../hooks/useToast";
import {
	_assignRoleByIdToUser,
	_fetchMyDataInServer,
	_fetchServerData,
	_fetchThumbnailsInGame,
	_unassignRoleByIdFromUser,
} from "../../remotes/remotes";
import { Button } from "../../ui/components/Button";
import { ResponsiveCard } from "../../ui/components/Card";
import { Chip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Skeleton } from "../../ui/components/Skeleton";
import { Loading } from "../Loading/Loading";

export const GameInfo = () => {
	const [isOnTransition, startTransition] = useLoading();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");
	const gameId = searchParams.get("gameId");
	const { showToast } = useToast();

	const _myDataInServerQuery = useSuspenseQuery({
		queryKey: ["myDataInServer", serverId],
		queryFn: () => _fetchMyDataInServer(serverId),
	});

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

		const mergedRolesObj: Record<string, (typeof mergedRoles)[number]> = {};
		mergedRoles.forEach((role) => {
			mergedRolesObj[role.roleId] = role;
		});

		return mergedRolesObj;
	}, [_serverData]);

	const categoriesObj = useMemo(() => {
		return _serverData.serverDataDb?.categories?.reduce(
			(obj, category: Category) => {
				obj[category.categoryId] = category;
				return obj;
			},
			{} as Record<number, Category>,
		);
	}, [_serverData]);

	const tagsObj = useMemo(() => {
		return _serverData.serverDataDb?.tags?.reduce(
			(obj, tag: Tag) => {
				obj[tag.tagId] = tag;
				return obj;
			},
			{} as Record<number, Tag>,
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
		queries: _fetchThumbnailsInGame.queries(serverId as string, [
			gameId as string,
		]),
	});

	const currentGame = useMemo(() => {
		return _serverData.serverDataDb?.games?.find(
			(game) => game.gameId === Number(gameId as string),
		);
	}, [_serverData, gameId]);

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
		await startTransition(_serverDataQuery.refetch());
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
						</Button>{" "}
						{_gameThumbnailQueries[0].isLoading ? (
							<Skeleton css={{ width: "64px", height: "64px" }} />
						) : (
							<img
								src={_gameThumbnailQueries[0].data || serverPlaceholderIcon}
								alt={currentGame?.name}
								css={{
									width: "64px",
									height: "64px",
									borderRadius: "16px",
								}}
							/>
						)}
						<div
							css={{ display: "flex", flexDirection: "column", width: "100%" }}
						>
							<h1 css={{ margin: 0 }}>{currentGame?.name}</h1>
							<div>게임 정보</div>
						</div>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<h2 css={{ margin: 0 }}>설명</h2>
						<span>{currentGame?.description || "설명 없음"}</span>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<h2 css={{ margin: 0 }}>카테고리</h2>
						<span>
							{currentGame?.categoryId
								? categoriesObj?.[currentGame.categoryId]?.name ||
									"카테고리 이름 없음"
								: "카테고리 없음"}
						</span>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<h2 css={{ margin: 0 }}>연결 채널</h2>
						<span>
							{currentGame?.channels
								?.map((channel) => `#${channelsObj?.[channel]?.name}`)
								.join(", ") || "채널 없음"}
						</span>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<h2 css={{ margin: 0 }}>태그</h2>
						<span>
							{currentGame?.gamesTags
								?.map((tag) => `#${tagsObj?.[tag.tagId]?.name}`)
								.join(", ") || "태그 없음"}
						</span>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<h2 css={{ margin: 0 }}>역할</h2>
						<div
							css={{
								display: "flex",
								flexDirection: "row",
								gap: "6px",
								flexWrap: "wrap",
							}}
						>
							{currentGame?.gamesRoles &&
								currentGame.gamesRoles.length > 0 &&
								currentGame.gamesRoles.map((role: RoleRelationToGame) => (
									<Chip
										key={role.roleId}
										css={{
											display: "flex",
											flexDirection: "row",
											gap: "4px",
											alignItems: "center",
											cursor: "pointer",
											...(_iHaveRole(_serverData, role.roleId) && {
												border: "1px solid black",
												background: "rgba(255, 255, 255, 1)",
												color: "rgba(0, 0, 0, 1)",
											}),
										}}
										onClick={() => toggleRoleAssign(role.roleId)}
									>
										<_8pxCircle
											css={{
												backgroundColor: `${
													rolesCombined[role.roleId]?.color || "#ffffff"
												}`,
											}}
										/>
										{rolesCombined[role.roleId]?.name || "역할 이름 없음"}
									</Chip>
								))}
						</div>
					</div>
				</ResponsiveCard>
			</FullPageBase>
		</Suspense>
	);
};
