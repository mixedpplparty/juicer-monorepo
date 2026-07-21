import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import {
	useQueries,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type {
	Category,
	RoleRelationToGame,
	ServerData,
	ServerDataDiscordChannel,
	Tag,
} from "juicer-shared";
import { Suspense, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import { _iHaveRole } from "../../functions/ServerFunctions";
import { useToast } from "../../hooks/useToast";
import {
	_assignRoleByIdToUser,
	_fetchMyDataInServer,
	_fetchServerData,
	_fetchThumbnailsInGame,
	_unassignRoleByIdFromUser,
} from "../../remotes/remotes";
import { Button } from "../../ui/components/Button";
import { Card } from "../../ui/components/Card";
import { _8pxCircle } from "../../ui/components/Circle";
import { Nav } from "../../ui/components/Nav";
import { PageTemplate } from "../../ui/components/PageTemplate";
import { Skeleton } from "../../ui/components/Skeleton";
import { Spinner } from "../../ui/components/Spinner";
import { NotVerified } from "../Auth/NotVerified";
import { Loading } from "../Loading/Loading";
export const GameInfo = () => {
	const queryClient = useQueryClient();
	const [pendingRoleIds, setPendingRoleIds] = useState<Set<string>>(new Set());
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

	// Flip a role's membership directly in the cached server data so the UI
	// reflects it without waiting on a refetch. The checkmark reads meInRole.
	const setRoleMembershipInCache = (roleId: string, meInRole: boolean) => {
		queryClient.setQueryData<ServerData>(
			_fetchServerData.query(serverId as string).queryKey,
			(prev) =>
				prev
					? {
							...prev,
							serverDataDiscord: {
								...prev.serverDataDiscord,
								roles: prev.serverDataDiscord.roles
									? prev.serverDataDiscord.roles.map((r) =>
											r.id === roleId ? { ...r, meInRole } : r,
										)
									: prev.serverDataDiscord.roles,
							},
						}
					: prev,
		);
	};

	const toggleRoleAssign = async (roleId: string) => {
		if (pendingRoleIds.has(roleId)) return;
		const currentlyHasRole = _iHaveRole(_serverData, roleId);
		// Optimistic: flip immediately, run the request in the background, and
		// reconcile via invalidation. No blocking server-data refetch in the click
		// path, and only this role is marked pending — the rest stays interactive.
		setRoleMembershipInCache(roleId, !currentlyHasRole);
		setPendingRoleIds((prev) => new Set(prev).add(roleId));
		try {
			if (currentlyHasRole) {
				await _unassignRoleByIdFromUser(serverId as string, roleId);
				showToast("역할을 해제했어요", "success");
			} else {
				await _assignRoleByIdToUser(serverId as string, roleId);
				showToast("역할을 받았어요", "success");
			}
			queryClient.invalidateQueries({ queryKey: ["myDataInServer", serverId] });
			queryClient.invalidateQueries({
				queryKey: _fetchServerData.query(serverId as string).queryKey,
			});
		} catch (error: unknown) {
			// Roll back the optimistic flip on failure.
			setRoleMembershipInCache(roleId, currentlyHasRole);
			if (isAxiosError(error)) {
				if (error.response?.data?.detail) {
					showToast(error.response?.data.detail as string, "error");
				} else {
					showToast(error.response?.data as string, "error");
				}
			}
		} finally {
			setPendingRoleIds((prev) => {
				const next = new Set(prev);
				next.delete(roleId);
				return next;
			});
		}
	};

	const iAmVerified = useMemo(() => {
		// if verification is not required, I am verified
		if (!_serverData.serverDataDb?.verificationRequired) {
			return true;
		}
		// if verification is required, check if I have the verification role
		const verificationCategoryIds = new Set(
			_serverData.serverDataDb?.roleCategories
				?.filter((category) => category.isVerification)
				.map((category) => category.roleCategoryId),
		);
		for (const role of Object.values(rolesCombined)) {
			if (
				role.roleCategoryId !== null &&
				verificationCategoryIds.has(role.roleCategoryId) &&
				!_iHaveRole(_serverData, role.roleId)
			) {
				return false;
			}
		}
		return true;
	}, [_serverData, rolesCombined]);

	if (!iAmVerified) {
		return (
			<Suspense fallback={<Loading />}>
				<NotVerified />
			</Suspense>
		);
	}

	const nav = (
		<Nav>
			<Button
				type="button"
				aria-label="뒤로 가기"
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
			<div css={{ display: "flex", flexDirection: "column", width: "100%" }}>
				<h1 css={{ margin: 0 }}>{currentGame?.name}</h1>
				<div>정보</div>
			</div>
		</Nav>
	);

	return (
		<Suspense fallback={<Loading />}>
			<PageTemplate nav={nav}>
				<div css={{ display: "flex", flexDirection: "column", gap: "18px" }}>
					<div css={{ display: "flex", flexDirection: "column", gap: "6px" }}>
						<h2 css={{ margin: 0 }}>설명</h2>
						<span>{currentGame?.description || "설명 없음"}</span>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "6px" }}>
						<h2 css={{ margin: 0 }}>카테고리</h2>
						<span>
							{currentGame?.categoryId
								? categoriesObj?.[currentGame.categoryId]?.name ||
									"카테고리 이름 없음"
								: "카테고리 없음"}
						</span>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "6px" }}>
						<h2 css={{ margin: 0 }}>연관 채널</h2>
						<span>
							{currentGame?.channels
								?.map((channel) => `#${channelsObj?.[channel]?.name}`)
								.join(", ") || "채널 없음"}
						</span>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "6px" }}>
						<h2 css={{ margin: 0 }}>태그</h2>
						<span>
							{currentGame?.gamesTags
								?.map((tag) => `#${tagsObj?.[tag.tagId]?.name}`)
								.join(", ") || "태그 없음"}
						</span>
					</div>
					<div css={{ display: "flex", flexDirection: "column", gap: "6px" }}>
						<h2 css={{ margin: 0 }}>역할</h2>
						<div
							css={{
								display: "flex",
								flexDirection: "column",
								gap: "12px",
								paddingBottom: "16px",
							}}
						>
							{currentGame?.gamesRoles &&
								currentGame.gamesRoles.length > 0 &&
								currentGame.gamesRoles.map((role: RoleRelationToGame) => (
									// biome-ignore lint/a11y/useSemanticElements: Card is a styled div; role + tabIndex + onKeyDown + aria-pressed give it full toggle-button semantics
									<Card
										role="button"
										tabIndex={pendingRoleIds.has(role.roleId) ? -1 : 0}
										aria-pressed={_iHaveRole(_serverData, role.roleId)}
										aria-label={rolesCombined[role.roleId]?.name || "역할"}
										onClick={
											pendingRoleIds.has(role.roleId)
												? undefined
												: () => toggleRoleAssign(role.roleId)
										}
										onKeyDown={(e) => {
											if (
												!pendingRoleIds.has(role.roleId) &&
												(e.key === "Enter" || e.key === " ")
											) {
												e.preventDefault();
												toggleRoleAssign(role.roleId);
											}
										}}
										key={role.roleId}
										css={{
											border: "1px solid rgb(255, 255, 255)",
											padding: "8px",
											// violet ring stays visible on both the dark default and the
											// white selected state.
											"&:focus-visible": {
												outline: "2px solid #8567D6",
												outlineOffset: "2px",
											},
											...(pendingRoleIds.has(role.roleId)
												? { opacity: "0.5", cursor: "not-allowed" }
												: {
														cursor: "pointer",
													}),
											...(_iHaveRole(_serverData, role.roleId) && {
												border: "1px solid black",
												background: "rgba(255, 255, 255, 1)",
												color: "rgba(0, 0, 0, 1)",
											}),
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
											{pendingRoleIds.has(role.roleId) ? (
												<Spinner
													css={{
														width: "24px",
														height: "24px",
														border: "4px solid rgba(122, 122, 122, 1)",
														borderTopColor: "rgba(255, 255, 255, 1)",
													}}
												/>
											) : _iHaveRole(_serverData, role.roleId) ? (
												<CheckIcon
													css={{
														width: "24px",
														height: "24px",
													}}
												/>
											) : (
												<div
													css={{
														width: "24px",
														height: "24px",
													}}
												/>
											)}
											<div
												css={{
													display: "flex",
													flexDirection: "row",
													gap: "4px",
													alignItems: "center",
												}}
											>
												<_8pxCircle
													css={{
														backgroundColor: `${rolesCombined[role.roleId]?.color || "#ffffff"}`,
													}}
												/>
												<h3 css={{ margin: 0, display: "block" }}>
													{rolesCombined[role.roleId]?.name || "역할 이름 없음"}
												</h3>
											</div>
											<div css={{ flex: 1 }}>
												{rolesCombined[role.roleId]?.description}
											</div>
										</div>
									</Card>
								))}
						</div>
					</div>
				</div>
			</PageTemplate>
		</Suspense>
	);
};
