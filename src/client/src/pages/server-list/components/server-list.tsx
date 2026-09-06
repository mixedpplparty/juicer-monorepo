import { CurrentUserFetch } from "@/features/auth/components/current-user.fetch";
import { ServerListPresenter } from "./server-list.presenter";
import { ServerListView } from "./server-list.view";
export function ServerList() {
	return (
		<CurrentUserFetch>
			{(myData) => (
				<ServerListPresenter myData={myData}>
					{(model) => <ServerListView {...model} />}
				</ServerListPresenter>
			)}
		</CurrentUserFetch>
	);
}
export default ServerList;
