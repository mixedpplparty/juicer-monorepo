import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import { ResponsiveCard } from "./Card";
import { FullPageBase } from "./FullPageBase";
import { Main } from "./Main";

export const PageTemplate = ({
	children,
	nav,
	footer,
}: {
	children: React.ReactNode;
	nav?: React.ReactNode;
	footer?: React.ReactNode;
}) => {
	const topRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);
	const [observeTop, unobserveTop] = useIntersectionObserver(
		() => {
			console.log("intersected top");
		},
		() => {
			console.log("unintersected top");
		},
	);
	const [observeBottom, unobserveBottom] = useIntersectionObserver(
		() => {
			console.log("intersected bottom");
		},
		() => {
			console.log("unintersected bottom");
		},
	);
	useEffect(() => {
		if (topRef.current) {
			observeTop(topRef.current);
		}
		if (bottomRef.current) {
			observeBottom(bottomRef.current);
		}
	}, [observeTop, observeBottom]);
	return (
		<FullPageBase>
			<ResponsiveCard css={{ gap: "12px" }}>
				{nav && (
					<nav
						ref={topRef}
						css={{ position: "sticky", top: "-1px", zIndex: 2 }}
					>
						{nav}
					</nav>
				)}
				<Main>{children}</Main>
				{footer && (
					<footer
						ref={bottomRef}
						css={{ position: "sticky", bottom: "-1px", zIndex: 2 }}
					>
						{footer}
					</footer>
				)}
			</ResponsiveCard>
		</FullPageBase>
	);
};
