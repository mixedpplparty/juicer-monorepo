import { DateTime, IANAZone } from "luxon";

export interface BirthdayRecord {
	userId: string;
	month: number;
	day: number;
}

export interface BirthdayServer {
	serverId: string;
	timezone: string;
}

export type BirthdayActionType = "announce" | "event";

export interface BirthdayAction {
	type: BirthdayActionType;
	serverId: string;
	userId: string;
	year: number;
}

export const ANNOUNCE_HOUR = 9;
export const EVENT_LEAD_DAYS = 7;

export function isValidTimezone(tz: string | null | undefined): boolean {
	return !!tz && IANAZone.isValidZone(tz);
}

// Feb-29 birthdays fall back to Feb 28 in non-leap years.
export function birthdayOccursOn(
	b: { month: number; day: number },
	dt: DateTime,
): boolean {
	if (b.month === 2 && b.day === 29 && !dt.isInLeapYear) {
		return dt.month === 2 && dt.day === 28;
	}
	return dt.month === b.month && dt.day === b.day;
}

export function actionKey(
	serverId: string,
	userId: string,
	year: number,
	type: BirthdayActionType,
): string {
	return `${serverId}:${userId}:${year}:${type}`;
}

export function isBirthdayEditable(createdAt: Date, nowMillis: number): boolean {
	return nowMillis < DateTime.fromJSDate(createdAt).plus({ months: 1 }).toMillis();
}

export function editableUntil(createdAt: Date): string {
	return DateTime.fromJSDate(createdAt).plus({ months: 1 }).toISO() as string;
}

export function computeBirthdayActions(
	servers: BirthdayServer[],
	birthdays: BirthdayRecord[],
	doneKeys: Set<string>,
	nowMillis: number,
): BirthdayAction[] {
	const actions: BirthdayAction[] = [];
	for (const server of servers) {
		if (!isValidTimezone(server.timezone)) continue;
		const local = DateTime.fromMillis(nowMillis, { zone: server.timezone });
		const lead = local.plus({ days: EVENT_LEAD_DAYS });
		for (const b of birthdays) {
			if (local.hour >= ANNOUNCE_HOUR && birthdayOccursOn(b, local)) {
				const key = actionKey(server.serverId, b.userId, local.year, "announce");
				if (!doneKeys.has(key)) {
					actions.push({
						type: "announce",
						serverId: server.serverId,
						userId: b.userId,
						year: local.year,
					});
				}
			}
			if (birthdayOccursOn(b, lead)) {
				const key = actionKey(server.serverId, b.userId, lead.year, "event");
				if (!doneKeys.has(key)) {
					actions.push({
						type: "event",
						serverId: server.serverId,
						userId: b.userId,
						year: lead.year,
					});
				}
			}
		}
	}
	return actions;
}
