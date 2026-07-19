import { Avatar, AvatarFallback, AvatarImage } from "juicer-m3/avatar";
import { Card } from "juicer-m3/card";
import { Chip, ChipGroup } from "juicer-m3/chip";
import { Text } from "juicer-m3/text";
import type { MyDataInServer } from "juicer-shared";
import { myServerProfileStyles } from "./my-server-profile.styles";

export interface MyServerProfileProps {
	myDataInServer: MyDataInServer;
}

export function MyServerProfile({ myDataInServer }: MyServerProfileProps) {
	return (
		<Card variant="outlined" css={myServerProfileStyles.root}>
			<div css={myServerProfileStyles.nicknameRow}>
				<Avatar size="lg">
					<AvatarImage src={myDataInServer.displayAvatarURL} alt="" />
					<AvatarFallback aria-hidden="true">
						{myDataInServer.displayName.substring(0, 2)}
					</AvatarFallback>
				</Avatar>
				<Text typeRole="title" size="large">
					{myDataInServer.displayName}
				</Text>
			</div>

			<div css={myServerProfileStyles.roleGroups}>
				{myDataInServer.categorizedRoles.map(
					({ roleCategoryId, roleCategoryName, roles }) => (
						<section
							key={roleCategoryId ?? "uncategorized"}
							css={myServerProfileStyles.roleGroup}
						>
							<Text
								as="h3"
								typeRole="label"
								size="large"
								css={myServerProfileStyles.roleGroupTitle}
							>
								{roleCategoryName ?? "미분류"}
							</Text>
							<ChipGroup
								aria-label={`${roleCategoryName ?? "미분류"} 역할`}
								css={myServerProfileStyles.roles}
							>
								{roles.map((role) => (
									<Chip
										key={role.roleId}
										variant="display"
										leadingIcon={
											<span
												aria-hidden="true"
												css={myServerProfileStyles.roleColor}
												style={{ backgroundColor: role.color }}
											/>
										}
									>
										{role.name}
									</Chip>
								))}
							</ChipGroup>
						</section>
					),
				)}
			</div>
		</Card>
	);
}

export default MyServerProfile;
