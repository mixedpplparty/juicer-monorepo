import AppBar from "~/components/app-bar";
import ClickableListItem from "~/components/clickable-list-item";
import ServerListItem from "~/components/server-list-item";
import type { Route } from "./+types/home";
export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "New React Router App" },
		{ name: "description", content: "Welcome to React Router!" },
	];
}

export default function Home() {
	return (
		<div>
			<AppBar showBackButton>appbar</AppBar>
			<ServerListItem>
				<img
					src="http://picsum.photos/48"
					style={{ borderRadius: "50%" }}
					alt="asdf"
				/>
				Server Item
			</ServerListItem>
			<ServerListItem>Server Item</ServerListItem>
			<ServerListItem>Server Item</ServerListItem>
			<ServerListItem>Server Item</ServerListItem>
			<ServerListItem>Server Item</ServerListItem>

			<ClickableListItem as="a" href="https://google.com">
				1
			</ClickableListItem>
			<ClickableListItem as="a" href="https://google.com">
				2
			</ClickableListItem>
			<ClickableListItem as="a" href="https://google.com">
				3
			</ClickableListItem>
		</div>
	);
}
