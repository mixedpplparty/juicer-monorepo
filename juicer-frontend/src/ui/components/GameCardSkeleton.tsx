import { Card } from "./Card";
import { Skeleton } from "./Skeleton";

export const GameCardSkeleton = () => {
	return (
		<Card
			css={{
				border: "1px solid rgba(255, 255, 255, 0.33)",
				display: "flex",
				flexDirection: "column",
				gap: "12px",
			}}
		>
			<div
				css={{
					display: "flex",
					flexDirection: "row",
					gap: "8px",
					alignItems: "center",
				}}
			>
				<Skeleton css={{ width: "25%", height: "1.5rem" }} />
				<Skeleton css={{ width: "10%", height: "1rem" }} />
			</div>
			<Skeleton css={{ width: "35%", height: "1rem" }} />
			<div css={{ display: "flex", flexDirection: "row", gap: "4px" }}>
				<Skeleton css={{ width: "10%", height: "1rem" }} />
				<Skeleton css={{ width: "10%", height: "1rem" }} />
				<Skeleton css={{ width: "10%", height: "1rem" }} />
			</div>
		</Card>
	);
};
