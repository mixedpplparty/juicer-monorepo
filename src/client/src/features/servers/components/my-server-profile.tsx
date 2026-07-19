import { Avatar, AvatarFallback, AvatarImage, Card, Text } from "juicer-m3";
import type { GuildMember } from "juicer-shared";
import { myServerProfileStyles } from "./my-server-profile.styles";

export interface ServerHeaderProps {
	myDataInServer: GuildMember;
}

export function MyServerProfile({
	myDataInServer: _myDataInServer,
}: ServerHeaderProps) {
	return (
		<Card variant="outlined" css={myServerProfileStyles.root}>
			<div css={myServerProfileStyles.nicknameRow}>
				<Avatar size="lg">
					<AvatarImage src={_myDataInServer.displayAvatarURL} />
					<AvatarFallback>
						{_myDataInServer.displayName.substring(0, 2)}
					</AvatarFallback>
				</Avatar>
				<Text typeRole="title" size="large">
					{_myDataInServer.displayName}
				</Text>
			</div>
		</Card>
	);
}

export default MyServerProfile;
