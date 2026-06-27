import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import {
	actionKey,
	birthdayOccursOn,
	computeBirthdayActions,
	editableUntil,
	isBirthdayEditable,
	isValidTimezone,
} from "../src/functions/birthday-core.js";

const NY = "America/New_York";
// 2026-06-27 14:00 in New York → fixed UTC millis for deterministic tests.
const JUNE_27_2PM_NY = DateTime.fromObject(
	{ year: 2026, month: 6, day: 27, hour: 14 },
	{ zone: NY },
).toMillis();

describe("isValidTimezone", () => {
	it("accepts IANA zones", () => {
		expect(isValidTimezone(NY)).toBe(true);
	});
	it("rejects junk / null", () => {
		expect(isValidTimezone("Not/AZone")).toBe(false);
		expect(isValidTimezone(null)).toBe(false);
	});
});

describe("birthdayOccursOn", () => {
	it("matches same month/day", () => {
		const dt = DateTime.fromObject({ year: 2026, month: 6, day: 27 });
		expect(birthdayOccursOn({ month: 6, day: 27 }, dt)).toBe(true);
	});
	it("maps Feb 29 to Feb 28 in non-leap years", () => {
		const nonLeap = DateTime.fromObject({ year: 2026, month: 2, day: 28 });
		expect(birthdayOccursOn({ month: 2, day: 29 }, nonLeap)).toBe(true);
	});
	it("keeps Feb 29 on Feb 29 in leap years", () => {
		const leap = DateTime.fromObject({ year: 2028, month: 2, day: 29 });
		expect(birthdayOccursOn({ month: 2, day: 29 }, leap)).toBe(true);
		const feb28Leap = DateTime.fromObject({ year: 2028, month: 2, day: 28 });
		expect(birthdayOccursOn({ month: 2, day: 29 }, feb28Leap)).toBe(false);
	});
});

describe("isBirthdayEditable / editableUntil", () => {
	it("is editable within one month of creation", () => {
		const created = new Date("2026-06-01T00:00:00.000Z");
		expect(isBirthdayEditable(created, Date.parse("2026-06-15T00:00:00.000Z"))).toBe(true);
	});
	it("is locked after one month", () => {
		const created = new Date("2026-06-01T00:00:00.000Z");
		expect(isBirthdayEditable(created, Date.parse("2026-07-02T00:00:00.000Z"))).toBe(false);
	});
	it("editableUntil is one month after creation (ISO)", () => {
		const created = new Date("2026-06-01T00:00:00.000Z");
		expect(editableUntil(created).startsWith("2026-07-01")).toBe(true);
	});
});

describe("computeBirthdayActions", () => {
	const servers = [{ serverId: "s1", timezone: NY }];
	const birthdays = [{ userId: "u1", month: 6, day: 27 }];

	it("emits an announce action on the day after 09:00 local", () => {
		const actions = computeBirthdayActions(servers, birthdays, new Set(), JUNE_27_2PM_NY);
		expect(actions).toContainEqual({ type: "announce", serverId: "s1", userId: "u1", year: 2026 });
	});

	it("does not announce before 09:00 local", () => {
		const before9 = DateTime.fromObject(
			{ year: 2026, month: 6, day: 27, hour: 7 },
			{ zone: NY },
		).toMillis();
		const actions = computeBirthdayActions(servers, birthdays, new Set(), before9);
		expect(actions.some((a) => a.type === "announce")).toBe(false);
	});

	it("emits an event action 7 days before the birthday", () => {
		const sevenBefore = DateTime.fromObject(
			{ year: 2026, month: 6, day: 20, hour: 3 },
			{ zone: NY },
		).toMillis();
		const actions = computeBirthdayActions(servers, birthdays, new Set(), sevenBefore);
		expect(actions).toContainEqual({ type: "event", serverId: "s1", userId: "u1", year: 2026 });
	});

	it("skips actions already in the done set", () => {
		const done = new Set([actionKey("s1", "u1", 2026, "announce")]);
		const actions = computeBirthdayActions(servers, birthdays, done, JUNE_27_2PM_NY);
		expect(actions.some((a) => a.type === "announce")).toBe(false);
	});

	it("skips servers with an invalid timezone", () => {
		const actions = computeBirthdayActions(
			[{ serverId: "bad", timezone: "Not/AZone" }],
			birthdays,
			new Set(),
			JUNE_27_2PM_NY,
		);
		expect(actions).toHaveLength(0);
	});
});
