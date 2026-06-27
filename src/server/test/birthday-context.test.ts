import type { Guild, GuildMember } from "discord.js";
import { describe, expect, it } from "vitest";
import { buildBirthdayContext } from "../src/functions/birthday-context.js";

// Minimal fakes shaped like the discord.js objects buildBirthdayContext reads.
// Crucially, `client.token` is present to prove it never leaks into the context.
function fakeMember(): GuildMember {
	return {
		id: "123",
		displayName: "Alice",
		nickname: "Al",
		joinedAt: new Date("2024-01-01T00:00:00.000Z"),
		displayAvatarURL: () => "https://cdn/avatar.png",
		user: { username: "alice", globalName: "Alice G" },
		client: { token: "SUPER_SECRET_TOKEN" },
		roles: {
			cache: {
				filter: (fn: (r: { name: string }) => boolean) => ({
					map: (m: (r: { name: string }) => string) =>
						[{ name: "@everyone" }, { name: "Member" }].filter(fn).map(m),
				}),
			},
		},
	} as unknown as GuildMember;
}

function fakeGuild(): Guild {
	return {
		id: "456",
		name: "Test Server",
		memberCount: 42,
		description: null,
		ownerId: "789",
		createdAt: new Date("2020-01-01T00:00:00.000Z"),
		iconURL: () => null,
		client: { token: "SUPER_SECRET_TOKEN" },
	} as unknown as Guild;
}

describe("buildBirthdayContext", () => {
	it("maps whitelisted fields only", () => {
		const ctx = buildBirthdayContext(fakeMember(), fakeGuild(), { month: 6, day: 27 });
		expect(ctx.member.displayName).toBe("Alice");
		expect(ctx.member.mention).toBe("<@123>");
		expect(ctx.member.username).toBe("alice");
		expect(ctx.member.roleNames).toEqual(["Member"]); // @everyone filtered out
		expect(ctx.guild.name).toBe("Test Server");
		expect(ctx.birthday).toEqual({ month: 6, day: 27 });
	});

	it("never leaks the client / token", () => {
		const ctx = buildBirthdayContext(fakeMember(), fakeGuild(), { month: 6, day: 27 });
		expect(JSON.stringify(ctx)).not.toContain("SUPER_SECRET_TOKEN");
		expect("client" in ctx.member).toBe(false);
		expect("client" in ctx.guild).toBe(false);
	});
});
