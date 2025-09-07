import AddIcon from "@mui/icons-material/Add";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
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
						{_myInfo.data?.guilds.map((guild: Guild) => (
							<LinkNoStyle to={`/server/${guild.id}`} key={guild.id}>
								<Card css={{ border: "1px solid rgb(255, 255, 255)" }}>
									<h2 css={{ margin: 0 }}>{guild.name}</h2>
									<p css={{ margin: 0 }}>
										by {guild.owner_name}, {guild.member_count}명
									</p>
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
