import { Chip } from "./Chip";
import { _8pxCircle } from "./Circle";

export const RoleChip = ({
	name,
	color,
}: {
	name: string;
	color: number[];
}) => {
	return (
		<Chip
			css={{
				display: "flex",
				flexDirection: "row",
				gap: "4px",
				alignItems: "center",
			}}
		>
			<_8pxCircle
				css={{
					backgroundColor: `rgb(${color.join(",") || "255, 255, 255"})`,
				}}
			/>
			{name}
		</Chip>
	);
};
