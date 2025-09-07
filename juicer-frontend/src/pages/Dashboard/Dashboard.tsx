import AddIcon from "@mui/icons-material/Add";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import serverPlaceholderIcon from "../../assets/server_icon_placeholder.png";
import { _fetchMyInfo } from "../../queries/queries";
import type { Guild } from "../../types/types";
import { AnchorNoStyle, LinkNoStyle } from "../../ui/components/Anchor";
import { Button } from "../../ui/components/Button";
import { Card, ResponsiveCard } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Loading } from "../Loading/Loading";
export const Dashboard = () => {
	const _myInfo = useSuspenseQuery({
		queryKey: ["myInfo"],
		queryFn: _fetchMyInfo,
	});

	useEffect(() => {
		console.log(_myInfo.data);
	}, [_myInfo.data]);

	return (
		<Suspense fallback={<Loading />}>
			<FullPageBase>
				<ResponsiveCard css={{ gap: "12px", maxHeight: "90%" }}>
					<div
						css={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<h1 css={{ margin: 0 }}>juicer</h1>
						<Button css={{ background: "#ed5555" }}>로그아웃</Button>
					</div>
					<div
						css={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							overflowY: "auto",
							maxHeight: "100%",
						}}
					>
						<div>봇과 나 자신 모두가 있는 서버만 표시됩니다.</div>
						{_myInfo.data?.guilds.map((guild: Guild) => (
							<LinkNoStyle to={`/server?serverId=${guild.id}`} key={guild.id}>
								<Card
									css={{
										border: "1px solid rgb(255, 255, 255)",
										display: "flex",
										flexDirection: "row",
										alignItems: "center",
										gap: "12px",
									}}
								>
									<img
										src={guild.icon || serverPlaceholderIcon}
										alt={guild.name}
										css={{ width: "48px", height: "48px", borderRadius: "50%" }}
									/>
									<div css={{ display: "flex", flexDirection: "column" }}>
										<h2 css={{ margin: 0 }}>{guild.name}</h2>
										<p css={{ margin: 0 }}>
											by {guild.owner_name}, {guild.member_count}명
										</p>
									</div>
								</Card>
							</LinkNoStyle>
						))}

						<AnchorNoStyle href={import.meta.env.VITE_BOT_INSTALL_URI}>
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
								서버에 봇 추가하기
							</Card>
						</AnchorNoStyle>
					</div>
				</ResponsiveCard>
			</FullPageBase>
		</Suspense>
	);
};
