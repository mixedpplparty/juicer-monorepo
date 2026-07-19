import { ArrowBackIcon, IconButton, SearchBar } from "juicer-m3";
import type { ServerData } from "juicer-shared";
import { Link } from "react-router";
import breakpoints from "../../constants/breakpoints";
import { hideOnDesktop } from "../../styles/styles";

export interface ServerHeaderProps {
	serverData: ServerData;
}

export function ServerHeader({ serverData: _serverData }: ServerHeaderProps) {
	return (
		<div
			css={{
				display: "flex",
				width: "100%",
				flexDirection: "column",
				[`@media (min-width: ${breakpoints.tablet})`]: {
					flexDirection: "row",
					alignItems: "center",
					gap: "2rem",
					padding: "1.5rem",
				},
			}}
		>
			<div
				css={{
					order: 0,
					display: "flex",
					height: "4rem",
					alignItems: "center",
					gap: "0.5rem",
					boxSizing: "border-box",
					padding: "0.25rem 1rem",
					"& > .jm3-search": {
						flex: "1 1 0",
						minWidth: 0,
					},
					[`@media (min-width: ${breakpoints.tablet})`]: {
						order: 1,
						flex: "0 1 40%",
						height: "auto",
						minWidth: "20%",
						maxWidth: "30rem",
						marginLeft: "auto",
						padding: 0,
					},
				}}
			>
				<IconButton
					aria-label="서버 목록으로 돌아가기"
					render={<Link to="/servers" />}
					css={hideOnDesktop}
				>
					<ArrowBackIcon />
				</IconButton>
				<SearchBar label="서버 검색" placeholder="검색" />
			</div>

			<div
				css={{
					order: 1,
					minWidth: 0,
					[`@media (min-width: ${breakpoints.tablet})`]: {
						order: 0,
						flex: "1 1 auto",
					},
				}}
			>
				Div 1
			</div>
		</div>
	);
}

export default ServerHeader;
