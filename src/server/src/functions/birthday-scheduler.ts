import { DateTime } from "luxon";
import * as cron from "node-cron";
import {
	actionKey,
	type BirthdayAction,
	computeBirthdayActions,
	EVENT_LEAD_DAYS,
} from "./birthday-core.js";
import { buildBirthdayContext } from "./birthday-context.js";
import {
	DEFAULT_EVENT_DESCRIPTION_TEMPLATE,
	DEFAULT_EVENT_NAME_TEMPLATE,
	DEFAULT_MESSAGE_TEMPLATE,
	renderTemplate,
} from "./birthday-templates.js";
import type { BirthdayRow, ServerRow } from "./db.js";
import {
	getAllBirthdays,
	getBirthdayAnnouncements,
	getEnabledBirthdayServers,
	markBirthdayAnnounced,
	markBirthdayEventCreated,
} from "./db.js";
import {
	createBirthdayScheduledEvent,
	discordClient,
	fetchMemberIfPresent,
	getGuildForBirthday,
	postBirthdayMessage,
} from "./discord-bot.js";

let tickRunning = false;

const executeAction = async (
	action: BirthdayAction,
	server: ServerRow,
	birthday: BirthdayRow,
): Promise<void> => {
	const member = await fetchMemberIfPresent(action.serverId, action.userId);
	if (!member) return; // user left the server — skip
	const guild = await getGuildForBirthday(action.serverId);
	if (!guild) return;
	const ctx = buildBirthdayContext(member, guild, {
		month: birthday.month,
		day: birthday.day,
	});

	if (action.type === "announce") {
		if (!server.birthdayChannelId) return;
		const tpl = server.birthdayMessageTemplate || DEFAULT_MESSAGE_TEMPLATE;
		const content = renderTemplate(tpl, ctx).slice(0, 2000);
		const ok = await postBirthdayMessage(
			action.serverId,
			server.birthdayChannelId,
			content,
		);
		if (ok) {
			await markBirthdayAnnounced(action.serverId, action.userId, action.year);
		}
		return;
	}

	// event: all-day window EVENT_LEAD_DAYS ahead, in the server's timezone
	const tz = server.birthdayTimezone as string;
	const nameTpl = server.birthdayEventNameTemplate || DEFAULT_EVENT_NAME_TEMPLATE;
	const descTpl =
		server.birthdayEventDescriptionTemplate || DEFAULT_EVENT_DESCRIPTION_TEMPLATE;
	const name = renderTemplate(nameTpl, ctx).slice(0, 100);
	const description = renderTemplate(descTpl, ctx).slice(0, 1000);
	const startLocal = DateTime.now()
		.setZone(tz)
		.plus({ days: EVENT_LEAD_DAYS })
		.startOf("day");
	const eventId = await createBirthdayScheduledEvent(
		action.serverId,
		name,
		description,
		startLocal.toJSDate(),
		startLocal.plus({ days: 1 }).toJSDate(),
	);
	if (eventId) {
		await markBirthdayEventCreated(
			action.serverId,
			action.userId,
			action.year,
			eventId,
		);
	}
};

export const runBirthdayTick = async (): Promise<void> => {
	if (!discordClient.isReady()) return;
	if (tickRunning) return;
	tickRunning = true;
	try {
	const [servers, birthdays] = await Promise.all([
		getEnabledBirthdayServers(),
		getAllBirthdays(),
	]);
	if (servers.length === 0 || birthdays.length === 0) return;
	const now = Date.now();

	// Build the "already done" set from the ledger for the relevant years.
	const doneKeys = new Set<string>();
	await Promise.all(
		servers.map(async (s) => {
			if (!s.birthdayTimezone) return;
			const local = DateTime.fromMillis(now, { zone: s.birthdayTimezone });
			const years = [...new Set([local.year, local.plus({ days: EVENT_LEAD_DAYS }).year])];
			const rows = await getBirthdayAnnouncements(s.serverId, years);
			for (const r of rows) {
				if (r.announcedAt) {
					doneKeys.add(actionKey(s.serverId, r.userId, r.year, "announce"));
				}
				if (r.discordEventId) {
					doneKeys.add(actionKey(s.serverId, r.userId, r.year, "event"));
				}
			}
		}),
	);

	const serverInputs = servers
		.filter((s) => s.birthdayTimezone)
		.map((s) => ({ serverId: s.serverId, timezone: s.birthdayTimezone as string }));
	const birthdayInputs = birthdays.map((b) => ({
		userId: b.userId,
		month: b.month,
		day: b.day,
	}));
	const actions = computeBirthdayActions(serverInputs, birthdayInputs, doneKeys, now);

	const serverById = new Map(servers.map((s) => [s.serverId, s]));
	const birthdayByUser = new Map(birthdays.map((b) => [b.userId, b]));
	for (const action of actions) {
		const server = serverById.get(action.serverId);
		const birthday = birthdayByUser.get(action.userId);
		if (!server || !birthday) continue;
		try {
			await executeAction(action, server, birthday);
		} catch (e) {
			console.error(
				`Birthday ${action.type} failed for ${action.userId} in ${action.serverId}:`,
				e,
			);
		}
	}
	} finally {
		tickRunning = false;
	}
};

export const startBirthdayScheduler = (): void => {
	cron.schedule("0 * * * *", () => {
		runBirthdayTick().catch((e) => console.error("Birthday tick error:", e));
	});
	// Catch-up shortly after boot (the ledger keeps this idempotent).
	setTimeout(() => {
		runBirthdayTick().catch((e) => console.error("Birthday tick error:", e));
	}, 15_000);
	console.log("Birthday scheduler started (hourly).");
};
