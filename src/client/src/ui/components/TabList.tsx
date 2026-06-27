import { useRef } from "react";

type Tab = { id: string; label: string };

// Accessible segmented tab control (ARIA tablist). The parent owns the active
// state and renders the matching tabpanel(s) with id `${idPrefix}-panel-<id>`
// and aria-labelledby `${idPrefix}-tab-<id>`.
export const TabList = ({
	tabs,
	active,
	onChange,
	ariaLabel,
	idPrefix = "tab",
}: {
	tabs: Tab[];
	active: string;
	onChange: (id: string) => void;
	ariaLabel?: string;
	idPrefix?: string;
}) => {
	const refs = useRef<Record<string, HTMLButtonElement | null>>({});

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
		e.preventDefault();
		const idx = tabs.findIndex((t) => t.id === active);
		const next =
			e.key === "ArrowRight"
				? (idx + 1) % tabs.length
				: (idx - 1 + tabs.length) % tabs.length;
		const nextId = tabs[next].id;
		onChange(nextId);
		refs.current[nextId]?.focus();
	};

	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			onKeyDown={onKeyDown}
			css={{
				display: "flex",
				flexDirection: "row",
				gap: "4px",
				padding: "4px",
				borderRadius: "16px",
				background: "rgba(255, 255, 255, 0.06)",
				border: "1px solid rgba(255, 255, 255, 0.15)",
				alignSelf: "flex-start",
				maxWidth: "100%",
				overflowX: "auto",
			}}
		>
			{tabs.map((t) => {
				const selected = t.id === active;
				return (
					<button
						key={t.id}
						ref={(el) => {
							refs.current[t.id] = el;
						}}
						type="button"
						role="tab"
						id={`${idPrefix}-tab-${t.id}`}
						aria-selected={selected}
						aria-controls={`${idPrefix}-panel-${t.id}`}
						tabIndex={selected ? 0 : -1}
						onClick={() => onChange(t.id)}
						css={{
							appearance: "none",
							border: "none",
							cursor: "pointer",
							font: "inherit",
							color: selected ? "#fff" : "rgba(255, 255, 255, 0.66)",
							background: selected
								? "rgba(255, 255, 255, 0.15)"
								: "transparent",
							padding: "12px 16px",
							borderRadius: "8px",
							whiteSpace: "nowrap",
							transition: "background 0.15s ease-out, color 0.15s ease-out",
							"&:hover": { color: "#fff" },
							"&:focus-visible": {
								outline: "2px solid rgba(255, 255, 255, 0.85)",
								outlineOffset: "2px",
							},
							"@media (prefers-reduced-motion: reduce)": { transition: "none" },
						}}
					>
						{t.label}
					</button>
				);
			})}
		</div>
	);
};
