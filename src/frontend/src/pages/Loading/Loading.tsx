import { ResponsiveCard } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";
import { Spinner } from "../../ui/components/Spinner";

export const Loading = ({ message }: { message?: string | undefined }) => {
	return (
		<FullPageBase>
			<ResponsiveCard
				css={{ alignItems: "center", justifyContent: "center", gap: "12px" }}
			>
				<Spinner />
				<h3 css={{ margin: 0 }}>{message || "Loading..."}</h3>
			</ResponsiveCard>
		</FullPageBase>
	);
};
