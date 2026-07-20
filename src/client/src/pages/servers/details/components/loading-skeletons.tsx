import { AppBar } from "@mixedpplparty/juicer-m3/app-bar";
import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { Card } from "@mixedpplparty/juicer-m3/card";
import { ArrowBackIcon } from "@mixedpplparty/juicer-m3/icons/arrow-back";
import { Skeleton } from "@mixedpplparty/juicer-m3/skeleton";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";
import { serverDetailsPageStyles } from "../server-details-page.styles";
import { loadingSkeletonStyles } from "./loading-skeletons.styles";
import { serverHeaderStyles } from "./server-header.styles";
import { serverInfoStyles } from "./server-info.styles";

const topicCards = [0, 1, 2, 3];
const skeletonRows = ["row-a", "row-b", "row-c", "row-d"];

export function ServerDetailsLayoutSkeleton() {
	return (
		<div
			role="status"
			aria-label="서버 정보 불러오는 중"
			css={serverDetailsPageStyles.root}
		>
			<ServerHeaderSkeleton />
			<div css={serverDetailsPageStyles.content}>
				<ServerOverviewSkeleton />
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
				<Skeleton css={loadingSkeletonStyles.circle} />
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
			<div css={serverInfoStyles.section}>
				<Skeleton css={loadingSkeletonStyles.sectionHeading} />
				<MyServerProfileSkeleton />
			</div>
			<div css={serverInfoStyles.section}>
				<Skeleton css={loadingSkeletonStyles.sectionHeading} />
				<TopicListSkeleton />
			</div>
		</div>
	);
}

export function MyServerProfileSkeleton() {
	return (
		<Card
			variant="outlined"
			role="status"
			aria-label="내 서버 프로필 불러오는 중"
			css={loadingSkeletonStyles.profileCard}
		>
			<div css={loadingSkeletonStyles.profileRow}>
				<Skeleton css={loadingSkeletonStyles.circle} />
				<Skeleton css={loadingSkeletonStyles.mediumLine} />
			</div>
			<div css={loadingSkeletonStyles.chips}>
				<Skeleton css={loadingSkeletonStyles.chip} />
				<Skeleton css={loadingSkeletonStyles.chip} />
				<Skeleton css={loadingSkeletonStyles.chip} />
			</div>
		</Card>
	);
}

export function TopicListSkeleton() {
	return (
		<div
			role="status"
			aria-label="주제 목록 불러오는 중"
			css={loadingSkeletonStyles.topicGrid}
		>
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
