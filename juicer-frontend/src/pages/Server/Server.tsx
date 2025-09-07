import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "react-router";
import { _fetchServerData } from "../../queries/queries";
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

	if (!serverId) {
		return <div>Server ID not found</div>;
	}

	return (
		<Suspense fallback={<Loading />}>
			<div>Server {serverId}</div>
		</Suspense>
	);
};
