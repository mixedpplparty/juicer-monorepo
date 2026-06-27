import type { ReactNode } from "react";

export type EmptyStateTone = "neutral" | "error" | "success";

// Accent drives the glowing icon ring. Pulled from the brand palette
// (electric violet / alert red / quest green) — depth via glow, not shadow.
const ACCENT: Record<EmptyStateTone, string> = {
	neutral: "#8567D6",
	error: "#ED5555",
	success: "#3BA85D",
};

// Reusable empty / error / locked moment. Where the playful, gamer-native
// voice lives (DESIGN.md): a backlit icon, a warm title, a clear next step.
// Caller supplies the icon + copy + optional action so it stays generic.
export const EmptyState = ({
	icon,
	title,
	description,
	action,
	tone = "neutral",
}: {
	icon?: ReactNode;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	tone?: EmptyStateTone;
}) => {
	const accent = ACCENT[tone];
	return (
		<output
			css={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
				gap: "12px",
				padding: "32px 16px",
				maxWidth: "440px",
				marginInline: "auto",
				animation: "emptyStateIn 0.3s ease-out both",
				"@keyframes emptyStateIn": {
					from: { opacity: 0, transform: "translateY(8px)" },
					to: { opacity: 1, transform: "translateY(0)" },
				},
				"@media (prefers-reduced-motion: reduce)": {
					animation: "none",
				},
			}}
		>
			{icon && (
				<div
					aria-hidden
					css={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: "64px",
						height: "64px",
						borderRadius: "100%",
						color: accent,
						background: `color-mix(in oklab, ${accent} 14%, transparent)`,
						border: `1px solid color-mix(in oklab, ${accent} 40%, transparent)`,
						boxShadow: `0 0 24px color-mix(in oklab, ${accent} 28%, transparent)`,
					}}
				>
					{icon}
				</div>
			)}
			<h3
				css={{
					margin: 0,
					fontSize: "1.17rem",
					fontWeight: 700,
					color: "#fff",
					textWrap: "balance",
				}}
			>
				{title}
			</h3>
			{description && (
				<p
					css={{
						margin: 0,
						color: "rgba(255, 255, 255, 0.85)",
						lineHeight: 1.5,
						textWrap: "pretty",
					}}
				>
					{description}
				</p>
			)}
			{action && (
				<div
					css={{
						display: "flex",
						flexWrap: "wrap",
						gap: "8px",
						justifyContent: "center",
						marginTop: "4px",
					}}
				>
					{action}
				</div>
			)}
		</output>
	);
};
