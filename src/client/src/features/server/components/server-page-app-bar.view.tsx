import { AppBar } from "@mixedpplparty/juicer-m3/app-bar";
import { IconButton } from "@mixedpplparty/juicer-m3/button";
import { ArrowBackIcon } from "@mixedpplparty/juicer-m3/icons/arrow-back";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { Link } from "react-router";
import { appBarStyles } from "@/shared/styles/app-bar";
import { serverAppBarStyles } from "./server-app-bar.styles";
import type { ServerPageAppBarViewModel } from "./server-page-app-bar.presenter";
export function ServerPageAppBarView({
	title,
	subtitle,
	backTo,
	backLabel,
	actions,
	scroll,
}: ServerPageAppBarViewModel) {
	return (
		<AppBar
			ref={scroll.ref}
			title={
				subtitle ? (
					<span css={serverAppBarStyles.title}>
						<Text typeRole="title" size="large" css={serverAppBarStyles.name}>
							{title}
						</Text>
						<Text
							typeRole="body"
							size="small"
							css={serverAppBarStyles.subtitle}
						>
							{subtitle}
						</Text>
					</span>
				) : (
					title
				)
			}
			container="transparent"
			data-scrolled={scroll.isScrolled}
			css={[
				appBarStyles.root,
				appBarStyles.insetInServerPage,
				appBarStyles.desktopFullBleedInServerPage,
			]}
			leading={
				<IconButton
					nativeButton={false}
					aria-label={backLabel}
					render={<Link to={backTo} />}
				>
					<ArrowBackIcon />
				</IconButton>
			}
			actions={actions}
		/>
	);
}
