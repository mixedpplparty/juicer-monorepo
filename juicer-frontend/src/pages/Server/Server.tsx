import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import { _createServer, _fetchServerData } from "../../queries/queries";
import { Button } from "../../ui/components/Button";
import { Card, ResponsiveCard } from "../../ui/components/Card";
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

	const _serverData = useSuspenseQuery({
		queryKey: ["serverData", serverId],
		queryFn: () => _fetchServerData(serverId),
	});

	const createServerMutation = useMutation({
		mutationFn: _createServer,
		onSuccess: () => {
			navigate(""); // refresh
		},
	});

	useEffect(() => {
		console.log(_serverData.data);
	}, [_serverData.data]);

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

					{_serverData.data?.server_data_db ? (
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
					) : (
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
								onClick={() =>
									createServerMutation.mutate({ serverId: serverId })
								}
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
						<label htmlFor="game-name">게임 이름</label>
						<Input id="game-name" />
						<label htmlFor="game-description">설명 (선택)</label>
						<Input id="game-description" />
						<label htmlFor="game-category">카테고리 (선택)</label>
						<Select id="game-category"></Select>
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
						>
							게임 추가
						</Button>
					</Modal>
				</ModalPortal>
			)}
		</Suspense>
	);
};
