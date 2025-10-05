import styled from "@emotion/styled";
import React from "react";
export const Chip = styled.div(
	(props: { variant?: "primary" | "unclickable" }) => ({
		borderRadius:
			!props.variant || props.variant === "primary" ? "16px" : "6px",
		background:
			!props.variant || props.variant === "primary"
				? "rgba(255, 255, 255, 0.1)"
				: "rgb(14, 14, 14)",
		padding: "4px 6px",
		border:
			!props.variant || props.variant === "primary"
				? "1px solid rgba(255, 255, 255, 0.66)"
				: "1px solid rgba(255, 255, 255, 0.15)",
	}),
);

//create checkableChip
export const CheckableChipBase = styled(Chip, {
	shouldForwardProp: (prop) => prop !== "checked",
})<{ checked?: boolean; disabled?: boolean }>((props) => ({
	background: props.checked
		? "rgba(255, 255, 255, 1)"
		: "rgba(255, 255, 255, 0.1)",
	color: props.disabled
		? "#999999"
		: props.checked
			? "rgba(0, 0, 0, 1)"
			: "rgba(255, 255, 255, 1)",
	display: "flex",
	flexDirection: "row",
	gap: "4px",
	alignItems: "center",
}));

type CheckableChipProps = {
	checked?: boolean;
	defaultChecked?: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
} & Omit<
	React.InputHTMLAttributes<HTMLInputElement>,
	"onChange" | "checked" | "defaultChecked" | "type"
> & {
		children?: React.ReactNode;
		className?: string;
		css?: React.CSSProperties;
	};

export const CheckableChip: React.FC<CheckableChipProps> = ({
	checked,
	defaultChecked,
	onChange,
	disabled,
	children,
	className,
	css,
	...rest
}) => {
	const isControlled = typeof checked === "boolean";
	const [internalChecked, setInternalChecked] = React.useState<boolean>(
		defaultChecked ?? false,
	); // used in uncontrolled mode; ignored when controlled
	const effectiveChecked = isControlled ? !!checked : internalChecked; // visual state. !! added for type safety

	return (
		<label
			className={className}
			css={{
				cursor: disabled ? "not-allowed" : "pointer",
				display: "inline-block",
				...css,
			}}
		>
			<input
				type="checkbox"
				checked={isControlled ? effectiveChecked : undefined}
				defaultChecked={!isControlled ? effectiveChecked : undefined}
				disabled={disabled}
				onChange={(e) => {
					if (!isControlled) setInternalChecked(e.target.checked);
					onChange?.(e.target.checked);
				}}
				style={{
					position: "absolute",
					opacity: 0,
					width: 1,
					height: 1,
					pointerEvents: "none",
				}}
				{...rest}
			/>
			<CheckableChipBase
				checked={effectiveChecked}
				disabled={disabled}
				aria-hidden
			>
				{children}
			</CheckableChipBase>
		</label>
	);
};
