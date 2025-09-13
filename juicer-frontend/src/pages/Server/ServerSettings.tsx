import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useLoading } from "../../hooks/useLoading";
import { useToast } from "../../hooks/useToast";
import {
	_createCategory,
	_createTag,
	_deleteCategory,
	_deleteTag,
	_fetchSearchGamesInServer,
	_fetchServerData,
} from "../../remotes/remotes";
import type { Category, ServerData, Tag } from "../../types/types";
import { Button, InlineButton } from "../../ui/components/Button";
import { ResponsiveCard } from "../../ui/components/Card";
import { Chip } from "../../ui/components/Chip";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Input } from "../../ui/components/Input";
import { Modal } from "../../ui/components/Modal";
import { ModalPortal } from "../../ui/components/ModalPortal";
import { Toast } from "../../ui/components/Toast";
import { Loading } from "../Loading/Loading";
export const ServerSettings = () => {
	//TODO do whatever when loading
	const [isLoading, startTransition] = useLoading();
	const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
		useState<boolean>(false);
	const [isCreateTagModalOpen, setIsCreateTagModalOpen] =
		useState<boolean>(false);
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");
	const { showToast } = useToast();

	const navigate = useNavigate();

	const _serverDataQuery = useSuspenseQuery(
		_fetchServerData.query(serverId as string),
	);
	const _serverData = _serverDataQuery.data.data as ServerData;

	const createCategoryFormAction = async (formData: FormData) => {
		const categoryName = formData.get("category-name");
		try {
			await startTransition(
				_createCategory(serverId as string, categoryName as string),
			);
			showToast("Category created", "success");
		} catch (error) {
			showToast(error.response.data.detail, "error");
		}
		await _serverDataQuery.refetch();
		setIsCreateCategoryModalOpen(false);
	};
	const createTagFormAction = async (formData: FormData) => {
		const tagName = formData.get("tag-name");
		try {
			await startTransition(_createTag(serverId as string, tagName as string));
			showToast("Tag created", "success");
		} catch (error) {
			showToast(error.response.data.detail, "error");
		}
		await _serverDataQuery.refetch();
		setIsCreateTagModalOpen(false);
	};
	const deleteCategoryAction = (categoryId: number) => async () => {
		try {
			await startTransition(_deleteCategory(serverId as string, categoryId));
			showToast("Category deleted", "success");
		} catch (error) {
			showToast(error.response.data.detail, "error");
		}
		await _serverDataQuery.refetch();
	};
	const deleteTagAction = (tagId: number) => async () => {
		try {
			await startTransition(_deleteTag(serverId as string, tagId));
			showToast("Tag deleted", "success");
		} catch (error) {
			showToast(error.response.data.detail, "error");
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
								<h2 css={{ margin: 0, flex: 1 }}>카테고리</h2>
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
									카테고리 추가
								</Button>
							</div>
							{!!_serverData.server_data_db.categories?.length || (
								<div css={{ color: "rgba(255, 255, 255, 0.5)" }}>
									서버에 카테고리가 없습니다.
								</div>
							)}
							{!!_serverData.server_data_db.categories?.length && (
								<div
									css={{ display: "flex", flexDirection: "row", gap: "6px" }}
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
							<div css={{ display: "flex", flexDirection: "row", gap: "6px" }}>
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
						<form action={createCategoryFormAction}>
							<Input
								type="text"
								name="category-name"
								placeholder="카테고리 이름"
							/>
							<Button type="submit">카테고리 추가</Button>
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
						<form action={createTagFormAction}>
							<Input type="text" name="tag-name" placeholder="태그 이름" />
							<Button type="submit">태그 추가</Button>
						</form>
					</Modal>
				</ModalPortal>
			)}
		</Suspense>
	);
};
