import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import { _fetchServerData } from "../../queries/queries";
import { AnchorNoStyle } from "../../ui/components/Anchor";
import { Button } from "../../ui/components/Button";
import { Card, ResponsiveCard } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Loading } from "../Loading/Loading";
export const Server = () => {
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");

	const _serverData = useSuspenseQuery({
		queryKey: ["serverData", serverId],
		queryFn: () => _fetchServerData(serverId),
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
					</div>

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
				</ResponsiveCard>
			</FullPageBase>
		</Suspense>
	);
};
