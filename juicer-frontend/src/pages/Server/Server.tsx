import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import { _createServer, _fetchServerData } from "../../queries/queries";
import { AnchorNoStyle } from "../../ui/components/Anchor";
import { Button } from "../../ui/components/Button";
import { Card, ResponsiveCard } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";
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
							<Button
								css={{
									background: "#5865F2",
									display: "flex",
									alignItems: "center",
									gap: "8px",
								}}
							>
								<SyncIcon css={{ width: "16px", height: "16px" }} />
								Sync
							</Button>
						)}
					</div>

					{_serverData.data?.server_data_db ? (
						<AnchorNoStyle href="">
							<Card
								css={{
									border: "1px solid rgba(255, 255, 255, 0.66)",
									alignItems: "center",
									cursor: "pointer",
									display: "flex",
									flexDirection: "row",
								}}
							>
								<AddIcon css={{ width: "16px", height: "16px" }} />
								게임 추가하기
							</Card>
						</AnchorNoStyle>
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
		</Suspense>
	);
};
