import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { Category, RoleCategory } from "juicer-shared";
import { Suspense, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useLoading } from "../../hooks/useLoading";
import { useToast } from "../../hooks/useToast";
import {
	_assignRoleCategoryToRole,
	_createCategory,
	_createRoleCategory,
	_createTag,
	_deleteCategory,
	_deleteRoleCategory,
	_fetchServerData,
	_updateRoleInfo,
	_updateServerVerificationRequired,
} from "../../remotes/remotes";
import { Button, InlineButton } from "../../ui/components/Button";
import { CheckableChip, Chip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { ConfirmModal } from "../../ui/components/ConfirmModal";
import { DragDropZone } from "../../ui/components/DragDropZone";
import { Input } from "../../ui/components/Input";
import { Modal } from "../../ui/components/Modal";
import { ModalPortal } from "../../ui/components/ModalPortal";
import { Nav } from "../../ui/components/Nav";
import { PageTemplate } from "../../ui/components/PageTemplate";
import { RoleChip } from "../../ui/components/RoleChip";
import { Option, Select } from "../../ui/components/Select";
import { NoAdminPerms } from "../Auth/NoAdminPerms";
import { Loading } from "../Loading/Loading";
export const ServerSettings = () => {
	const draggedFrom = useRef<number | null>(null);
	const draggedRoleId = useRef<string | null>(null);

	const [isOnTransition, startTransition] = useLoading();
	const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
		useState<boolean>(false);
	const [isCreateTagModalOpen, setIsCreateTagModalOpen] =
		useState<boolean>(false);
	const [isCreateRoleCategoryModalOpen, setIsCreateRoleCategoryModalOpen] =
		useState<boolean>(false);
	const [isRoleSettingsModalOpen, setIsRoleSettingsModalOpen] =
		useState<boolean>(false);
	const [roleSettingsModalRole, setRoleSettingsModalRole] = useState<{
		roleId: string | null;
		name?: string | undefined;
		color?: string | undefined;
		roleCategoryId: number | null;
		roleCategoryName?: string | undefined | null;
		selfAssignable: boolean;
		description: string | null;
	} | null>(null);
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");
	const { showToast } = useToast();
	const [pendingDelete, setPendingDelete] = useState<{
		kind: "roleCategory" | "category";
		id: number;
		name: string;
	} | null>(null);

	const navigate = useNavigate();

	const _serverDataQuery = useSuspenseQuery(
		_fetchServerData.query(serverId as string),
	);
	const _serverData = _serverDataQuery.data;

	const [verificationRequiredChecked, setVerificationRequiredChecked] =
		useState<boolean>(_serverData.serverDataDb?.verificationRequired || false);

	const updateVerificationRequirement = async (checked: boolean) => {
		try {
			await startTransition(
				_updateServerVerificationRequired(serverId as string, checked),
			);
			showToast("인증 설정을 변경했어요", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
	};

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
					description: dbRole.description,
				};
			})
			.filter((role) => role.name !== "@everyone"); // without @everyone

		const mergedRolesObj: Record<string, (typeof mergedRoles)[number]> = {};
		mergedRoles.forEach((role) => {
			mergedRolesObj[role.roleId] = role;
		});

		return mergedRolesObj;
	}, [_serverData, roleCategoriesObj]);

	const createCategoryFormAction = async (
		formData: FormData,
	): Promise<void> => {
		const categoryName = formData.get("category-name");
		try {
			await startTransition(
				_createCategory(serverId as string, categoryName as string),
			);
			showToast("주제 분류를 추가했어요", "success");
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
		setIsCreateCategoryModalOpen(false);
	};
	const createRoleCategoryFormAction = async (
		formData: FormData,
	): Promise<void> => {
		const roleCategoryName = formData.get("role-category-name");
		try {
			await startTransition(
				_createRoleCategory(serverId as string, roleCategoryName as string),
			);
			showToast("역할 분류를 추가했어요", "success");
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
		setIsCreateRoleCategoryModalOpen(false);
	};
	const createTagFormAction = async (formData: FormData): Promise<void> => {
		const tagName = formData.get("tag-name");
		try {
			await startTransition(_createTag(serverId as string, tagName as string));
			showToast("태그를 추가했어요", "success");
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
		setIsCreateTagModalOpen(false);
	};
	const deleteRoleCategoryAction =
		(roleCategoryId: number) => async (): Promise<void> => {
			try {
				await startTransition(
					_deleteRoleCategory(serverId as string, roleCategoryId),
				);
				showToast("역할 분류를 삭제했어요", "success");
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
		};
	const deleteCategoryAction =
		(categoryId: number) => async (): Promise<void> => {
			try {
				await startTransition(_deleteCategory(serverId as string, categoryId));
				showToast("주제 분류를 삭제했어요", "success");
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
		};

	const handleRoleSettingsModalOpen =
		(role: {
			roleId: string | null;
			name?: string | undefined;
			color?: string | undefined;
			roleCategoryId: number | null;
			roleCategoryName?: string | undefined | null;
			selfAssignable: boolean;
			description: string | null;
		}) =>
		() => {
			setRoleSettingsModalRole(role);
			setIsRoleSettingsModalOpen(true);
		};

	const handleRoleSettingsModalClose = () => {
		setRoleSettingsModalRole(null);
		setIsRoleSettingsModalOpen(false);
	};

	const updateRoleFormAction = async (formData: FormData) => {
		const roleCategoryId =
			formData.get("role-category-id") === ""
				? null
				: Number(formData.get("role-category-id"));
		const description = formData.get("role-description") as
			| string
			| null
			| undefined;
		const selfAssignable = formData.get("self-assignable") === "on";
		try {
			await startTransition(
				_assignRoleCategoryToRole(
					serverId as string,
					roleCategoryId,
					roleSettingsModalRole?.roleId as string,
				),
			);
			await startTransition(
				_updateRoleInfo(
					serverId as string,
					roleSettingsModalRole?.roleId as string,
					selfAssignable,
					description,
				),
			);
			showToast("역할 정보를 저장했어요", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await startTransition(_serverDataQuery.refetch());
		handleRoleSettingsModalClose();
	};
	const handleOnDragStart =
		(role: { roleId: string; roleCategoryId: number | null }) => () => {
			draggedFrom.current = role.roleCategoryId;
			draggedRoleId.current = role.roleId;
		};

	const handleOnDrop = async (e: React.DragEvent<HTMLElement>) => {
		if (draggedRoleId.current) {
			if (
				Number((e.currentTarget as HTMLElement).id) !== draggedFrom.current &&
				!(
					(e.currentTarget as HTMLElement).id === "unassigned" &&
					draggedFrom.current === null
				)
			) {
				await startTransition(
					_assignRoleCategoryToRole(
						serverId as string,
						(e.currentTarget as HTMLElement).id === "unassigned"
							? null
							: Number((e.currentTarget as HTMLElement).id),
						draggedRoleId.current,
					),
				);
				await startTransition(_serverDataQuery.refetch());
				showToast("역할을 옮겼어요", "success");
			}
			draggedRoleId.current = null;
		}
	};
	const nav = (
		<Nav
			css={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				gap: "12px",
			}}
		>
			<Button
				type="button"
				aria-label="뒤로 가기"
				css={{ background: "none", alignItems: "center" }}
				onClick={() => navigate(`/server?serverId=${serverId}`)}
			>
				<ArrowBackIcon css={{ width: "24px", height: "24px" }} />
			</Button>
			<div css={{ display: "flex", flexDirection: "column", width: "100%" }}>
				<h1 css={{ margin: 0 }}>서버 설정</h1>
				<div>{_serverData.serverDataDiscord.name}</div>
			</div>
		</Nav>
	);

	if (!_serverData.admin) {
		return (
			<Suspense fallback={<Loading />}>
				<NoAdminPerms />
			</Suspense>
		);
	}

	return (
		<Suspense fallback={<Loading />}>
			<PageTemplate nav={nav}>
				<div
					css={{
						display: "flex",
						flexDirection: "column",
						width: "100%",
						gap: "12px",
					}}
				>
					<div
						css={{
							display: "flex",
							flexDirection: "column",
							width: "100%",
							gap: "12px",
						}}
					>
						<h2 css={{ margin: 0, flex: 1 }}>서버 이용 인증</h2>
						<CheckableChip
							checked={verificationRequiredChecked}
							disabled={isOnTransition}
							onChange={(checked) => {
								setVerificationRequiredChecked(checked);
								updateVerificationRequirement(checked);
							}}
						>
							인증 필요
						</CheckableChip>
					</div>
					<div
						css={{ color: "rgba(255, 255, 255, 0.66)", fontSize: "0.875rem" }}
					>
						켜면 인증 역할을 가진 멤버만 주제를 보고 역할을 받을 수 있어요.
					</div>
					<div
						css={{
							display: "flex",
							flexDirection: "column",
							width: "100%",
							gap: "12px",
						}}
					>
						<div
							css={{
								display: "flex",
								flexDirection: "row",
							}}
						>
							<h2 css={{ margin: 0, flex: 1 }}>분류 없는 역할</h2>
						</div>
						{!!_serverData.serverDataDiscord.roles?.length || (
							<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
								서버에 역할이 없습니다.
							</div>
						)}
						{!!_serverData.serverDataDiscord.roles?.length && (
							<DragDropZone
								id="unassigned"
								onDrop={handleOnDrop}
								emptyLabel="미분류 역할이 없어요"
							>
								{Object.values(rolesCombined)
									.filter((role) => role.roleCategoryId === null)
									.map((role) => {
										return (
											<RoleChip
												key={role.roleId}
												id={role.roleId}
												name={role.name || `이름없음 (ID ${role.roleId})`}
												color={role.color || "#ffffff"}
												draggable={draggedRoleId.current !== role.roleId}
												onDragStart={handleOnDragStart(role)}
												onClick={handleRoleSettingsModalOpen(role)}
												isLoading={draggedRoleId.current === role.roleId}
											/>
										);
									})}
							</DragDropZone>
						)}
					</div>
					<div
						css={{
							display: "flex",
							flexDirection: "column",
							width: "100%",
							gap: "12px",
						}}
					>
						<div
							css={{
								display: "flex",
								flexDirection: "row",
							}}
						>
							<h2 css={{ margin: 0, flex: 1 }}>역할 분류</h2>
							<Button
								css={{
									background: "#5865F2",
									display: "flex",
									alignItems: "center",
									gap: "8px",
								}}
								onClick={() => setIsCreateRoleCategoryModalOpen(true)}
							>
								<AddIcon css={{ width: "16px", height: "16px" }} />
								역할 분류 추가
							</Button>
						</div>
						<div
							css={{ color: "rgba(255, 255, 255, 0.66)", fontSize: "0.875rem" }}
						>
							역할을 분류로 묶으면 회원이 역할을 받을 때 그룹으로 볼 수 있어요.
						</div>
						{!!_serverData.serverDataDb?.roleCategories?.length || (
							<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
								서버에 역할 카테고리가 없습니다.
							</div>
						)}
						{!!_serverData.serverDataDb?.roleCategories?.length && (
							<div
								css={{
									display: "flex",
									flexDirection: "column",
									gap: "6px",
									flexWrap: "wrap",
								}}
							>
								{_serverData.serverDataDb?.roleCategories?.map(
									(roleCategory: RoleCategory) => (
										<div
											key={roleCategory.roleCategoryId}
											css={{
												display: "flex",
												flexDirection: "column",
												gap: "4px",
											}}
										>
											<div
												css={{
													display: "flex",
													flexDirection: "row",
													gap: "4px",
													alignItems: "center",
												}}
											>
												{roleCategory.roleCategoryId !== 1 && (
													<InlineButton
														css={{
															height: "100%",
															alignItems: "center",
															justifyContent: "center",
														}}
														type="button"
														aria-label="역할 분류 삭제"
														onClick={() =>
															setPendingDelete({
																kind: "roleCategory",
																id: roleCategory.roleCategoryId,
																name: roleCategory.name,
															})
														}
													>
														<DeleteIcon
															css={{
																width: "16px",
																height: "16px",
																color: "#FFF",
															}}
														/>
													</InlineButton>
												)}
												<h3 css={{ margin: 0 }}>{roleCategory.name}</h3>
											</div>
											<DragDropZone
												id={roleCategory.roleCategoryId}
												onDrop={handleOnDrop}
												emptyLabel="역할을 여기로 끌어다 놓으세요"
											>
												{Object.values(rolesCombined)
													.filter(
														(role) =>
															role.roleCategoryId ===
															roleCategory.roleCategoryId,
													)
													.map((role) => {
														return (
															<RoleChip
																key={role.roleId}
																id={role.roleId}
																name={
																	role.name || `이름없음 (ID ${role.roleId})`
																}
																color={role.color || "#ffffff"}
																draggable={
																	draggedRoleId.current !== role.roleId
																}
																onDragStart={handleOnDragStart(role)}
																onClick={handleRoleSettingsModalOpen(role)}
																isLoading={
																	draggedRoleId.current === role.roleId
																}
															/>
														);
													})}
											</DragDropZone>
										</div>
									),
								)}
							</div>
						)}
					</div>
					<div
						css={{
							display: "flex",
							flexDirection: "column",
							width: "100%",
							gap: "12px",
						}}
					>
						<div
							css={{
								display: "flex",
								flexDirection: "row",
							}}
						>
							<h2 css={{ margin: 0, flex: 1 }}>주제 분류</h2>
							<Button
								css={{
									background: "#5865F2",
									display: "flex",
									alignItems: "center",
									gap: "8px",
								}}
								onClick={() => setIsCreateCategoryModalOpen(true)}
							>
								<AddIcon css={{ width: "16px", height: "16px" }} />
								주제 분류 추가
							</Button>
						</div>
						{!!_serverData.serverDataDb?.categories?.length || (
							<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
								서버에 주제 카테고리가 없습니다.
							</div>
						)}
						{!!_serverData.serverDataDb?.categories?.length && (
							<div
								css={{
									display: "flex",
									flexDirection: "row",
									gap: "6px",
									flexWrap: "wrap",
								}}
							>
								{_serverData.serverDataDb?.categories?.map(
									(category: Category) => (
										<Chip
											key={category.categoryId}
											css={{
												display: "flex",
												flexDirection: "row",
												gap: "4px",
											}}
										>
											<InlineButton
												css={{
													height: "100%",
													alignItems: "center",
													justifyContent: "center",
												}}
												type="button"
												aria-label="주제 분류 삭제"
												onClick={() =>
													setPendingDelete({
														kind: "category",
														id: category.categoryId,
														name: category.name,
													})
												}
											>
												<DeleteIcon
													css={{
														width: "16px",
														height: "16px",
														color: "#FFF",
													}}
												/>
											</InlineButton>
											{category.name}
										</Chip>
									),
								)}
							</div>
						)}
						<div></div>
					</div>
				</div>
			</PageTemplate>
			{isCreateCategoryModalOpen && (
				<ModalPortal>
					<Modal
						title="카테고리 추가"
						onClose={() => setIsCreateCategoryModalOpen(false)}
					>
						<form
							onSubmit={async (e) => {
								e.preventDefault(); // prevent reload
								if (isOnTransition) return;
								const formData = new FormData(e.currentTarget);
								await createCategoryFormAction(formData);
							}}
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<Input
								type="text"
								name="category-name"
								placeholder="카테고리 이름"
							/>
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
								{isOnTransition ? "작업 중..." : "카테고리 추가"}
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
			{isCreateTagModalOpen && (
				<ModalPortal>
					<Modal
						title="태그 추가"
						onClose={() => setIsCreateTagModalOpen(false)}
					>
						<form
							onSubmit={async (e) => {
								e.preventDefault(); // prevent reload
								if (isOnTransition) return;
								const formData = new FormData(e.currentTarget);
								await createTagFormAction(formData);
							}}
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<Input type="text" name="tag-name" placeholder="태그 이름" />
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
								{isOnTransition ? "작업 중..." : "태그 추가"}
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
			{isCreateRoleCategoryModalOpen && (
				<ModalPortal>
					<Modal
						title="역할 분류 추가"
						onClose={() => setIsCreateRoleCategoryModalOpen(false)}
					>
						<form
							onSubmit={async (e) => {
								e.preventDefault(); // prevent reload
								if (isOnTransition) return;
								const formData = new FormData(e.currentTarget);
								await createRoleCategoryFormAction(formData);
							}}
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<Input
								type="text"
								name="role-category-name"
								placeholder="역할 분류 이름"
							/>
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
								{isOnTransition ? "작업 중..." : "역할 분류 추가"}
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
			{isRoleSettingsModalOpen && (
				<ModalPortal>
					<Modal title="역할 설정" onClose={handleRoleSettingsModalClose}>
						<form
							onSubmit={async (e) => {
								e.preventDefault(); // prevent reload
								if (isOnTransition) return;
								const formData = new FormData(e.currentTarget);
								await updateRoleFormAction(formData);
							}}
							css={{ display: "flex", flexDirection: "column", gap: "12px" }}
						>
							<div
								css={{ display: "flex", flexDirection: "column", gap: "4px" }}
							>
								<span>이름</span>
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
											backgroundColor:
												roleSettingsModalRole?.color || "#ffffff",
										}}
									/>
									<h3 css={{ margin: 0 }}>
										{roleSettingsModalRole?.name ||
											`이름없음 (ID ${roleSettingsModalRole?.roleId})`}
									</h3>
								</div>
							</div>
							<label htmlFor="role-category-id">역할 분류</label>
							<Select
								id="role-category-id"
								name="role-category-id"
								defaultValue={
									roleSettingsModalRole?.roleCategoryId?.toString() || ""
								}
							>
								<Option value="">분류 없음</Option>
								{_serverData.serverDataDb?.roleCategories?.map(
									(roleCategory) => (
										<Option
											key={roleCategory.roleCategoryId}
											value={roleCategory.roleCategoryId.toString()}
										>
											{roleCategory.name}
										</Option>
									),
								)}
							</Select>
							<div
								css={{
									color: "rgba(255, 255, 255, 0.66)",
									fontSize: "0.875rem",
								}}
							>
								분류에 넣으면 회원이 역할을 받을 때 그룹으로 보여요.
							</div>
							<label htmlFor="role-description">역할 설명(선택)</label>
							<Input
								id="role-description"
								name="role-description"
								defaultValue={roleSettingsModalRole?.description || undefined}
								placeholder="역할 설명"
							/>
							<CheckableChip
								name="self-assignable"
								defaultChecked={roleSettingsModalRole?.selfAssignable}
							>
								누구나 이 역할 할당 가능
							</CheckableChip>
							<div
								css={{
									color: "rgba(255, 255, 255, 0.66)",
									fontSize: "0.875rem",
								}}
							>
								켜면 회원이 이 역할을 직접 받을 수 있어요. 끄면 관리자만 부여할
								수 있어요.
							</div>
							<Button
								css={{
									background: "#5865F2",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "8px",
								}}
								loading={isOnTransition}
								disabled={isOnTransition}
								type="submit"
							>
								{isOnTransition ? "작업 중..." : "역할 정보 저장"}
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
			{pendingDelete && (
				<ConfirmModal
					title={
						pendingDelete.kind === "roleCategory"
							? "역할 분류를 삭제할까요?"
							: "주제 분류를 삭제할까요?"
					}
					description={`'${pendingDelete.name}' 분류가 사라지고, 이 분류에 속한 항목은 미분류로 돌아가요. 이 작업은 되돌릴 수 없어요.`}
					loading={isOnTransition}
					onClose={() => setPendingDelete(null)}
					onConfirm={async () => {
						if (pendingDelete.kind === "roleCategory") {
							await deleteRoleCategoryAction(pendingDelete.id)();
						} else {
							await deleteCategoryAction(pendingDelete.id)();
						}
						setPendingDelete(null);
					}}
				/>
			)}
		</Suspense>
	);
};
