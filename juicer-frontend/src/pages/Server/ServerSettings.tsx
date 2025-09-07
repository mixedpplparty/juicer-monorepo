import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import SyncIcon from "@mui/icons-material/Sync";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import { _fetchServerData } from "../../queries/queries";
import { Button, InlineButton } from "../../ui/components/Button";
import { Card, ResponsiveCard } from "../../ui/components/Card";
import { Chip } from "../../ui/components/Chip";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Loading } from "../Loading/Loading";
export const ServerSettings = () => {
	const [searchParams] = useSearchParams();
	const serverId = searchParams.get("serverId");

	const navigate = useNavigate();

	const _serverData = useSuspenseQuery({
		queryKey: ["serverData", serverId],
		queryFn: () => _fetchServerData(serverId),
	});

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
							<div>{_serverData.data?.server_data_discord.name}</div>
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
							<h2 css={{ margin: 0 }}>카테고리</h2>
						</div>
						<div
							css={{
								display: "flex",
								flexDirection: "column",
								width: "100%",
								gap: "12px",
							}}
						>
							<h2 css={{ margin: 0 }}>태그</h2>
							<div css={{ display: "flex", flexDirection: "row", gap: "6px" }}>
								<Chip
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
									>
										<DeleteIcon
											css={{ width: "16px", height: "16px", color: "#FFF" }}
										/>
									</InlineButton>
									태그1
								</Chip>
								<Chip>태그2</Chip>
								<Chip>태그3</Chip>
								<Chip>태그4</Chip>
								<Chip>태그5</Chip>
								<Chip>태그6</Chip>
								<Chip>태그7</Chip>
								<Chip>태그8</Chip>
								<Chip>태그9</Chip>
								<Chip>태그10</Chip>
							</div>
						</div>
					</div>
				</ResponsiveCard>
			</FullPageBase>
		</Suspense>
	);
};
