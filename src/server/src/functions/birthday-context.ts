import type { Guild, GuildMember } from "discord.js";
import type { BirthdayContext } from "./birthday-templates.js";

// THE security boundary: flatten live discord.js objects to whitelisted
// primitives. Never spread or pass the originals — they expose client.token.
export function buildBirthdayContext(
	member: GuildMember,
	guild: Guild,
	birthday: { month: number; day: number },
): BirthdayContext {
	return {
		member: {
			id: member.id,
			mention: `<@${member.id}>`,
			displayName: member.displayName,
			username: member.user.username,
			globalName: member.user.globalName ?? null,
			nickname: member.nickname ?? null,
			joinedAt: member.joinedAt ? member.joinedAt.toISOString() : null,
			avatarURL: member.displayAvatarURL(),
			roleNames: member.roles.cache
				.filter((r) => r.name !== "@everyone")
				.map((r) => r.name),
		},
		guild: {
			id: guild.id,
			name: guild.name,
			memberCount: guild.memberCount,
			description: guild.description ?? null,
			iconURL: guild.iconURL(),
			ownerId: guild.ownerId,
			createdAt: guild.createdAt ? guild.createdAt.toISOString() : null,
		},
		birthday: { month: birthday.month, day: birthday.day },
	};
}
