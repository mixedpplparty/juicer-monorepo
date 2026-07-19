import { AppBar, ArrowBackIcon, Card, IconButton, Skeleton } from "juicer-m3";
import type { ReactNode } from "react";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";
import { serverDetailsPageStyles } from "../server-details-page.styles";
import { loadingSkeletonStyles } from "./loading-skeletons.styles";
import { serverHeaderStyles } from "./server-header.styles";
import { serverInfoStyles } from "./server-info.styles";

const topicCards = [0, 1, 2, 3];
const skeletonRows = ["row-a", "row-b", "row-c", "row-d"];

export type ServerRouteSkeletonKind =
	| "overview"
	| "settings"
	| "topic"
	| "topic-edit";

export function ServerDetailsLayoutSkeleton({
	kind = "overview",
	content,
}: {
	kind?: ServerRouteSkeletonKind;
	content?: ReactNode;
}) {
	return (
		<div
			role="status"
			aria-label="서버 정보 불러오는 중"
			css={serverDetailsPageStyles.root}
		>
			{kind === "overview" ? <ServerHeaderSkeleton /> : <TopicAppBarSkeleton />}
			<div css={serverDetailsPageStyles.content}>
				{content ?? <ServerOverviewSkeleton />}
			</div>
		</div>
	);
}

export function ServerHeaderSkeleton() {
	return (
		<header css={serverHeaderStyles.root}>
			<div
				css={[
					appBarStyles.root,
					appBarStyles.insetInServerPage,
					serverHeaderStyles.searchRow,
				]}
			>
				<Skeleton css={[loadingSkeletonStyles.circle, hideOnDesktop]} />
				<Skeleton css={loadingSkeletonStyles.headerSearch} />
			</div>
			<div css={loadingSkeletonStyles.serverDetails}>
				<Skeleton css={loadingSkeletonStyles.largeCircle} />
				<div css={loadingSkeletonStyles.serverText}>
					<Skeleton css={loadingSkeletonStyles.titleLine} />
					<Skeleton css={loadingSkeletonStyles.shortLine} />
				</div>
			</div>
		</header>
	);
}

export function TopicAppBarSkeleton() {
	return (
		<AppBar
			container="transparent"
			css={[appBarStyles.root, appBarStyles.insetInServerPage]}
			leading={
				<IconButton type="button" aria-label="이전 페이지" disabled>
					<ArrowBackIcon />
				</IconButton>
			}
			title={
				<span
					aria-label="주제 정보 불러오는 중"
					role="status"
					css={loadingSkeletonStyles.appBarTitle}
				>
					<Skeleton css={loadingSkeletonStyles.mediumLine} />
					<Skeleton css={loadingSkeletonStyles.shortLine} />
				</span>
			}
		/>
	);
}

export function ServerOverviewSkeleton() {
	return (
		<div
			role="status"
			aria-label="서버 상세 불러오는 중"
			css={serverInfoStyles.root}
		>
			<section css={serverInfoStyles.section}>
				<Skeleton css={loadingSkeletonStyles.sectionHeading} />
				<Card variant="outlined" css={loadingSkeletonStyles.profileCard}>
					<div css={loadingSkeletonStyles.profileRow}>
						<Skeleton css={loadingSkeletonStyles.largeCircle} />
						<Skeleton css={loadingSkeletonStyles.mediumLine} />
					</div>
					<div css={loadingSkeletonStyles.chips}>
						<Skeleton css={loadingSkeletonStyles.chip} />
						<Skeleton css={loadingSkeletonStyles.chip} />
						<Skeleton css={loadingSkeletonStyles.chip} />
					</div>
				</Card>
			</section>
			<section css={serverInfoStyles.section}>
				<Skeleton css={loadingSkeletonStyles.sectionHeading} />
				<TopicListSkeleton />
			</section>
		</div>
	);
}

export function TopicListSkeleton() {
	return (
		<div aria-hidden="true" css={loadingSkeletonStyles.topicGrid}>
			{topicCards.map((card) => (
				<div key={card} css={loadingSkeletonStyles.topicCard}>
					<Skeleton css={loadingSkeletonStyles.mediumLine} />
					<Skeleton css={loadingSkeletonStyles.shortLine} />
					<Skeleton css={loadingSkeletonStyles.mediumLine} />
				</div>
			))}
		</div>
	);
}

export function SkeletonRows({ count }: { count: number }) {
	return (
		<div aria-hidden="true" css={loadingSkeletonStyles.listSurface}>
			{skeletonRows.slice(0, count).map((row) => (
				<div key={row} css={loadingSkeletonStyles.listRow}>
					<Skeleton css={loadingSkeletonStyles.circle} />
					<div css={loadingSkeletonStyles.serverText}>
						<Skeleton css={loadingSkeletonStyles.mediumLine} />
						<Skeleton css={loadingSkeletonStyles.shortLine} />
					</div>
				</div>
			))}
		</div>
	);
}
