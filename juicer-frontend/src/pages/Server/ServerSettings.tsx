import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSuspenseQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
	_findRoleById,
	filterOutEveryoneRole,
} from "../../functions/ServerFunctions";
import { useLoading } from "../../hooks/useLoading";
import { useToast } from "../../hooks/useToast";
import {
	_createCategory,
	_createRoleCategory,
	_createTag,
	_deleteCategory,
	_deleteRoleCategory,
	_deleteTag,
	_fetchServerData,
} from "../../remotes/remotes";
import type {
	Category,
	Role,
	RoleCategory,
	ServerDataDiscordRole,
	Tag,
} from "../../types/types";
import { Button, InlineButton } from "../../ui/components/Button";
import { ResponsiveCard } from "../../ui/components/Card";
import { Chip } from "../../ui/components/Chip";
import { _8pxCircle } from "../../ui/components/Circle";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Input } from "../../ui/components/Input";
import { Modal } from "../../ui/components/Modal";
import { ModalPortal } from "../../ui/components/ModalPortal";
import { RoleChip } from "../../ui/components/RoleChip";
import { Loading } from "../Loading/Loading";
export const ServerSettings = () => {
	//TODO do whatever when loading
	// usages of isLoading to be added later
	const [isLoading, startTransition] = useLoading();
	const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
		useState<boolean>(false);
	const [isCreateTagModalOpen, setIsCreateTagModalOpen] =
		useState<boolean>(false);
	const [isCreateRoleCategoryModalOpen, setIsCreateRoleCategoryModalOpen] =
		useState<boolean>(false);
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");
	const { showToast } = useToast();

	const navigate = useNavigate();

	const _serverDataQuery = useSuspenseQuery(
		_fetchServerData.query(serverId as string),
	);
	const _serverData = _serverDataQuery.data;

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
							<div>{_serverData.server_data_discord.name}</div>
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
							{!!_serverData.server_data_discord.roles?.length || (
								<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
									서버에 역할이 없습니다.
								</div>
							)}
							{!!_serverData.server_data_discord.roles?.length && (
								<div
									css={{
										display: "flex",
										flexDirection: "row",
										gap: "4px",
										flexWrap: "wrap",
									}}
								>
									{filterOutEveryoneRole(
										_serverData,
										_serverData.server_data_db.roles || [],
									)
										.filter((role: Role) => role.role_category_id === null)
										.map((role: Role) => {
											return (
												<RoleChip
													key={role.id}
													name={_findRoleById(_serverData, role.id)?.name || ""}
													color={
														_findRoleById(_serverData, role.id)?.color || [
															255, 255, 255,
														]
													}
												/>
											);
										})}
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
							{!!_serverData.server_data_db.role_categories?.length || (
								<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
									서버에 역할 카테고리가 없습니다.
								</div>
							)}
							{!!_serverData.server_data_db.role_categories?.length && (
								<div
									css={{
										display: "flex",
										flexDirection: "column",
										gap: "6px",
										flexWrap: "wrap",
									}}
								>
									{_serverData.server_data_db.role_categories?.map(
										(roleCategory: RoleCategory) => (
											<div
												key={roleCategory.id}
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
													onClick={deleteRoleCategoryAction(roleCategory.id)}
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
							{!!_serverData.server_data_db.categories?.length || (
								<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
									서버에 주제 카테고리가 없습니다.
								</div>
							)}
							{!!_serverData.server_data_db.categories?.length && (
								<div
									css={{
										display: "flex",
										flexDirection: "row",
										gap: "6px",
										flexWrap: "wrap",
									}}
								>
									{_serverData.server_data_db.categories?.map(
										(category: Category) => (
											<Chip
												key={category.id}
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
													onClick={deleteCategoryAction(category.id)}
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
								{!!_serverData.server_data_db.tags?.length || (
									<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
										서버에 태그가 없습니다.
									</div>
								)}
								{!!_serverData.server_data_db.tags?.length && (
									<div
										css={{
											display: "flex",
											flexDirection: "row",
											gap: "6px",
											flexWrap: "wrap",
										}}
									>
										{_serverData.server_data_db.tags?.map((tag: Tag) => (
											<Chip
												key={tag.id}
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
													onClick={deleteTagAction(tag.id)}
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
		</Suspense>
	);
};
