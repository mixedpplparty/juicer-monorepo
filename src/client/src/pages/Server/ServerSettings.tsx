import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { Category, RoleCategory, Tag } from "juicer-shared";
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
	_deleteTag,
	_fetchServerData,
	_setRoleSelfAssignable,
} from "../../remotes/remotes";
import { Button, InlineButton } from "../../ui/components/Button";
import { ResponsiveCard } from "../../ui/components/Card";
import { Chip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { DragDropZone } from "../../ui/components/DragDropZone";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Input } from "../../ui/components/Input";
import { Modal } from "../../ui/components/Modal";
import { ModalPortal } from "../../ui/components/ModalPortal";
import { RoleChip } from "../../ui/components/RoleChip";
import { Option, Select } from "../../ui/components/Select";
import { Loading } from "../Loading/Loading";
export const ServerSettings = () => {
	//TODO do whatever when loading
	// usages of isLoading to be added later
	const draggedFrom = useRef<number | null>(null);
	const draggedRoleId = useRef<string | null>(null);

	const [isLoading, startTransition] = useLoading();
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
	} | null>(null);
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");
	const { showToast } = useToast();

	const navigate = useNavigate();

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

	const createCategoryFormAction = async (
		formData: FormData,
	): Promise<void> => {
		const categoryName = formData.get("category-name");
		try {
			await startTransition(
				_createCategory(serverId as string, categoryName as string),
			);
			showToast("Category created", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
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
			showToast("Role category created", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
		setIsCreateRoleCategoryModalOpen(false);
	};
	const createTagFormAction = async (formData: FormData): Promise<void> => {
		const tagName = formData.get("tag-name");
		try {
			await startTransition(_createTag(serverId as string, tagName as string));
			showToast("Tag created", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
		setIsCreateTagModalOpen(false);
	};
	const deleteRoleCategoryAction =
		(roleCategoryId: number) => async (): Promise<void> => {
			try {
				await startTransition(
					_deleteRoleCategory(serverId as string, roleCategoryId),
				);
				showToast("Role category deleted", "success");
			} catch (error: unknown) {
				if (isAxiosError(error)) {
					showToast(error.response?.data.detail as string, "error");
				}
			}
			await _serverDataQuery.refetch();
		};
	const deleteCategoryAction =
		(categoryId: number) => async (): Promise<void> => {
			try {
				await startTransition(_deleteCategory(serverId as string, categoryId));
				showToast("Category deleted", "success");
			} catch (error: unknown) {
				if (isAxiosError(error)) {
					showToast(error.response?.data.detail as string, "error");
				}
			}
			await _serverDataQuery.refetch();
		};
	const deleteTagAction = (tagId: number) => async (): Promise<void> => {
		try {
			await startTransition(_deleteTag(serverId as string, tagId));
			showToast("Tag deleted", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
	};

	const handleRoleSettingsModalOpen =
		(role: {
			roleId: string | null;
			name?: string | undefined;
			color?: string | undefined;
			roleCategoryId: number | null;
			roleCategoryName?: string | undefined | null;
			selfAssignable: boolean;
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
				_setRoleSelfAssignable(
					serverId as string,
					roleSettingsModalRole?.roleId as string,
					selfAssignable,
				),
			);
			showToast("Role updated", "success");
		} catch (error: unknown) {
			if (isAxiosError(error)) {
				showToast(error.response?.data.detail as string, "error");
			}
		}
		await _serverDataQuery.refetch();
		handleRoleSettingsModalClose();
	};
	const handleOnDragStart =
		(role: { roleId: string; roleCategoryId: number | null }) => () => {
			draggedFrom.current = role.roleCategoryId;
			draggedRoleId.current = role.roleId;
		};

	const handleOnDrop = async (e: React.DragEvent<HTMLElement>) => {
		if (draggedRoleId.current) {
			console.log(
				"drop",
				draggedRoleId.current,
				"from",
				draggedFrom.current,
				"to",
				(e.currentTarget as HTMLElement).id,
			);

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
				await _serverDataQuery.refetch();
			}
			draggedRoleId.current = null;
		}
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
							css={{ display: "flex", flexDirection: "column", width: "100%" }}
						>
							<h1 css={{ margin: 0 }}>서버 설정</h1>
							<div>{_serverData.serverDataDiscord.name}</div>
						</div>
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
								<DragDropZone id="unassigned" onDrop={handleOnDrop}>
									{Object.values(rolesCombined)
										.filter((role) => role.roleCategoryId === null)
										.map((role) => {
											return (
												<RoleChip
													key={role.roleId}
													id={role.roleId}
													name={role.name || `이름없음 (ID ${role.roleId})`}
													color={role.color || "#ffffff"}
													draggable={true}
													onDragStart={handleOnDragStart(role)}
													onClick={handleRoleSettingsModalOpen(role)}
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
													<InlineButton
														css={{
															height: "100%",
															alignItems: "center",
															justifyContent: "center",
														}}
														onClick={deleteRoleCategoryAction(
															roleCategory.roleCategoryId,
														)}
													>
														<DeleteIcon
															css={{
																width: "16px",
																height: "16px",
																color: "#FFF",
															}}
														/>
													</InlineButton>
													<h3 css={{ margin: 0 }}>{roleCategory.name}</h3>
												</div>
												<DragDropZone
													id={roleCategory.roleCategoryId}
													onDrop={handleOnDrop}
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
																	draggable={true}
																	onDragStart={handleOnDragStart(role)}
																	onClick={handleRoleSettingsModalOpen(role)}
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
													onClick={deleteCategoryAction(category.categoryId)}
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
								<h2 css={{ margin: 0, flex: 1 }}>태그</h2>
								<Button
									css={{
										background: "#5865F2",
										display: "flex",
										alignItems: "center",
										gap: "8px",
									}}
									onClick={() => setIsCreateTagModalOpen(true)}
								>
									<AddIcon css={{ width: "16px", height: "16px" }} />
									태그 추가
								</Button>
							</div>
							<div
								css={{
									display: "flex",
									flexDirection: "row",
									gap: "6px",
								}}
							>
								{!!_serverData.serverDataDb?.tags?.length || (
									<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
										서버에 태그가 없습니다.
									</div>
								)}
								{!!_serverData.serverDataDb?.tags?.length && (
									<div
										css={{
											display: "flex",
											flexDirection: "row",
											gap: "6px",
											flexWrap: "wrap",
										}}
									>
										{_serverData.serverDataDb?.tags?.map((tag: Tag) => (
											<Chip
												key={tag.tagId}
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
													onClick={deleteTagAction(tag.tagId)}
												>
													<DeleteIcon
														css={{
															width: "16px",
															height: "16px",
															color: "#FFF",
														}}
													/>
												</InlineButton>
												{tag.name}
											</Chip>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</ResponsiveCard>
			</FullPageBase>
			{isCreateCategoryModalOpen && (
				<ModalPortal>
					<Modal
						title="카테고리 추가"
						onClose={() => setIsCreateCategoryModalOpen(false)}
					>
						<form
							action={createCategoryFormAction}
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
								type="submit"
							>
								카테고리 추가
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
							action={createTagFormAction}
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
								type="submit"
							>
								태그 추가
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
							action={createRoleCategoryFormAction}
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
								type="submit"
							>
								역할 분류 추가
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
			{isRoleSettingsModalOpen && (
				<ModalPortal>
					<Modal title="역할 설정" onClose={handleRoleSettingsModalClose}>
						<form
							action={updateRoleFormAction}
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
							<div css={{ display: "flex", flexDirection: "row", gap: "4px" }}>
								<input
									type="checkbox"
									id="self-assignable"
									name="self-assignable"
									defaultChecked={roleSettingsModalRole?.selfAssignable}
								/>
								<label htmlFor="self-assignable">
									누구나 이 역할 할당 가능
								</label>
							</div>
							<Button
								css={{
									background: "#5865F2",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "8px",
								}}
								type="submit"
							>
								역할 정보 저장
							</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
		</Suspense>
	);
};
