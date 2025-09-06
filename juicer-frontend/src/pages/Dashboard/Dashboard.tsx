import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Card } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { _fetchDiscordUserData } from "../../queries/queries";
import { Suspense, useEffect } from "react";
import { Loading } from "../Loading/Loading";

export const Dashboard = () => {
	const _discordUserData = useSuspenseQuery({
		queryKey: ["discordUserData"],
		queryFn: _fetchDiscordUserData,
	});

	useEffect(() => {
		console.log(_discordUserData.data);
	}, [_discordUserData.data]);

	return (
		<Suspense fallback={<Loading />}>
		<FullPageBase>
			<Card>
				<h1 css={{ margin: 0 }}>juicer</h1>
				<div>
					It seems like it's your first time here. Would you like to register as
					admin or user?
					</div>
				</Card>
			</FullPageBase>
		</Suspense>
	);
};
