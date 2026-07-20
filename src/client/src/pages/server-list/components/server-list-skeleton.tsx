import { css } from "@emotion/react";
import { AppBar } from "@mixedpplparty/juicer-m3/app-bar";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { Skeleton } from "@mixedpplparty/juicer-m3/skeleton";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";

const rows = ["server-a", "server-b", "server-c", "server-d", "server-e"];

const styles = {
	list: css({ padding: 0 }),
	item: css({ minHeight: "4.5rem" }),
	circle: css({
		width: "2.5rem",
		height: "2.5rem",
		borderRadius: "50%",
	}),
	headline: css({
		width: "12rem",
		maxWidth: "70%",
		height: "1rem",
		borderRadius: "0.5rem",
	}),
	supporting: css({
		width: "7rem",
		height: "0.75rem",
		borderRadius: "0.375rem",
	}),
};

export function ServerListSkeleton() {
	return (
		<div role="status" aria-label="서버 목록 불러오는 중">
			<AppBar
				title="서버 목록"
				container="transparent"
				css={[appBarStyles.root, hideOnDesktop]}
			/>
			<List container="transparent" aria-hidden="true" css={styles.list}>
				{rows.map((row) => (
					<ListItem
						key={row}
						css={styles.item}
						leading={<Skeleton css={styles.circle} />}
						headline={<Skeleton css={styles.headline} />}
						supportingText={<Skeleton css={styles.supporting} />}
					/>
				))}
			</List>
		</div>
	);
}

export default ServerListSkeleton;
