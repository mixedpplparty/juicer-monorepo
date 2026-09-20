import { MemberProfileFetch } from "@/features/server/components/member-profile.fetch";
import { MyServerProfilePresenter } from "./my-server-profile.presenter";
import { MyServerProfileView } from "./my-server-profile.view";
export interface MyServerProfileProps {
	serverId: string;
}
export function MyServerProfile({ serverId }: MyServerProfileProps) {
	return (
		<MemberProfileFetch serverId={serverId}>
			{(myDataInServer) => (
				<MyServerProfilePresenter myDataInServer={myDataInServer}>
					{(model) => <MyServerProfileView {...model} />}
				</MyServerProfilePresenter>
			)}
		</MemberProfileFetch>
	);
}
export default MyServerProfile;
