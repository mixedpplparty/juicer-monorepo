# Birthday Announcements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users set a global birthday (month + day, editable for one month then locked); on the day the bot posts an admin-configured congrats message and creates a Discord scheduled event (7 days ahead) in every enabled server the user is in.

**Architecture:** A pure decision core (`computeBirthdayActions`) holds all timezone / Feb-29 / lead-date logic; an hourly `node-cron` tick loads enabled servers + birthdays + a dedupe ledger, asks the core what to do, and executes via thin Discord/DB adapters. Admin-authored Handlebars templates render against a whitelisted plain-object context — never live discord.js objects. Idempotency comes from a `(serverId, userId, year)` unique ledger.

**Tech Stack:** TypeScript (ESM/NodeNext), Hono, Drizzle ORM (Postgres), discord.js v14, luxon, handlebars, node-cron, vitest; React + MUI/Emotion + TanStack Query (client); zod in `juicer-shared`.

## Global Constraints

- Package manager is **pnpm** only. Monorepo lives under `src/` (workspaces: `client`, `server`, `shared`).
- Server is ESM, `module: NodeNext`, `verbatimModuleSyntax: true` → **use `import type` for type-only imports** and **`.js` extensions on local relative imports**.
- Server package name is **`backend`**; build is `tsc`; new tests run under **vitest** (`pnpm test`).
- Shared types are consumed as `juicer-shared/dist/types/index.js` on the **server** and `juicer-shared` on the **client**. The shared package must be rebuilt (`cd src/shared && pnpm build`) after editing its types.
- **Security boundary (non-negotiable):** templates are only ever rendered against the output of `buildBirthdayContext` (whitelisted primitives). Never pass a `GuildMember`/`Guild`/`Client` into a template.
- Discord limits: congrats message ≤ **2000** chars, event name ≤ **100**, event description ≤ **1000**.
- Behavior constants: announce at/after **09:00 local**, event lead **7 days**, edit window **1 month**, precision **month + day only**, **Feb 29 → Feb 28** in non-leap years.
- Client UI copy is **Korean** to match existing pages. New client form controls use **native `<select>/<input>/<textarea>`** plus the existing `Card`/`Button` components (avoids guessing custom `Select`/`Input` props).

## File Structure

**Created (server):**
- `src/server/vitest.config.ts` — vitest config (test dir only)
- `src/server/test/smoke.test.ts` — setup smoke test
- `src/server/test/birthday-core.test.ts`
- `src/server/test/birthday-templates.test.ts`
- `src/server/test/birthday-context.test.ts`
- `src/server/test/birthday-validation.test.ts`
- `src/server/src/db/schema/birthdays.ts` — `birthdays` + `birthdayAnnouncements` tables
- `src/server/src/functions/birthday-core.ts` — pure decision logic
- `src/server/src/functions/birthday-templates.ts` — Handlebars render + validate
- `src/server/src/functions/birthday-context.ts` — discord.js → whitelisted context
- `src/server/src/functions/birthday-scheduler.ts` — cron tick + executor

**Modified (server):**
- `src/server/package.json`, `src/server/tsconfig.json`
- `src/server/src/db/schema/servers.ts`, `src/server/src/db/schemas.ts`
- `src/server/src/functions/db.ts`, `src/server/src/functions/discord-bot.ts`
- `src/server/src/routes/discord/user.ts`, `src/server/src/routes/discord/server/index.ts`
- `src/server/src/index.ts`

**Modified (shared):** `src/shared/src/types/index.ts`

**Modified (client):** `src/client/src/remotes/remotes.tsx`, `src/client/src/pages/Dashboard/Dashboard.tsx`, `src/client/src/pages/Server/ServerSettings.tsx`
**Created (client):** `src/client/src/pages/Dashboard/BirthdayCard.tsx`, `src/client/src/pages/Server/BirthdayAnnouncementsSettings.tsx`

**Modified (docs):** `README.md`

> All commands below assume the **repo root** (`.../feat+birthday-announcements`) as the working directory.

---

### Task 1: Dependencies & vitest setup

**Files:**
- Modify: `src/server/package.json` (deps + `test` script)
- Modify: `src/server/tsconfig.json` (exclude test files)
- Create: `src/server/vitest.config.ts`
- Test: `src/server/test/smoke.test.ts`

**Interfaces:**
- Produces: a runnable `pnpm test` in `src/server` (vitest), and `luxon` / `handlebars` / `node-cron` available to later tasks.

- [ ] **Step 1: Install runtime + dev dependencies**

Run:
```bash
cd src/server && pnpm add luxon handlebars node-cron && pnpm add -D vitest @types/luxon @types/node-cron && cd ../..
```
Expected: installs succeed; `package.json` lists `luxon`, `handlebars`, `node-cron` under dependencies and `vitest`, `@types/luxon`, `@types/node-cron` under devDependencies.

- [ ] **Step 2: Add the `test` script**

Edit `src/server/package.json` `scripts` to add:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create vitest config**

Create `src/server/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		environment: "node",
	},
});
```

- [ ] **Step 4: Keep tests out of the `tsc` build**

`src/server/tsconfig.json` has no `include`, so `tsc` would compile `test/` and `vitest.config.ts`. Replace its `exclude` line with:
```json
	"exclude": ["node_modules", "dist", "test", "vitest.config.ts", "**/*.test.ts"]
```

- [ ] **Step 5: Write the smoke test**

Create `src/server/test/smoke.test.ts`:
```ts
import { describe, expect, it } from "vitest";

describe("test setup", () => {
	it("runs", () => {
		expect(1 + 1).toBe(2);
	});
});
```

- [ ] **Step 6: Run the smoke test**

Run: `cd src/server && pnpm test && cd ../..`
Expected: PASS — 1 test passed.

- [ ] **Step 7: Verify the server still builds**

Run: `cd src/server && pnpm build && cd ../..`
Expected: `tsc` exits 0 with no output.

- [ ] **Step 8: Commit**

```bash
git add src/server/package.json src/server/pnpm-lock.yaml src/pnpm-lock.yaml src/server/tsconfig.json src/server/vitest.config.ts src/server/test/smoke.test.ts
git commit -m "chore(server): add luxon/handlebars/node-cron + vitest setup"
```
(If `src/server/pnpm-lock.yaml` does not exist, the lockfile is `src/pnpm-lock.yaml`; add whichever changed.)

---

### Task 2: Shared types & validation

**Files:**
- Modify: `src/shared/src/types/index.ts`

**Interfaces:**
- Produces (exported from `juicer-shared`):
  - `isValidMonthDay(month: number, day: number): boolean`
  - `UpdateBirthdayRequestBody` (zod) + type `{ month: number; day: number }`
  - `GetBirthdayResponse` type: `{ month: number; day: number; editable: boolean; editableUntil: string } | null`
  - `UpdateServerBirthdayConfigRequestBody` (zod) + type
  - `ServerDataDb` extended with: `birthdayChannelId`, `birthdayTimezone`, `birthdayMessageTemplate`, `birthdayEventNameTemplate`, `birthdayEventDescriptionTemplate` (all `string | null`)

- [ ] **Step 1: Add birthday schemas + the validity helper**

Append to `src/shared/src/types/index.ts` (end of file):
```ts
// ── Birthday announcements ──────────────────────────────────────────────

// Max day per month with Feb 29 allowed (leap-agnostic). Rejects Feb 30/31,
// Apr/Jun/Sep/Nov 31, etc. Year is intentionally not stored.
const _MAX_DAY_PER_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isValidMonthDay(month: number, day: number): boolean {
	if (!Number.isInteger(month) || !Number.isInteger(day)) return false;
	if (month < 1 || month > 12) return false;
	if (day < 1) return false;
	return day <= _MAX_DAY_PER_MONTH[month - 1];
}

export const UpdateBirthdayRequestBody = z
	.object({
		month: z.number().int().min(1).max(12),
		day: z.number().int().min(1).max(31),
	})
	.refine((b) => isValidMonthDay(b.month, b.day), {
		message: "Invalid month/day combination.",
	});

export type UpdateBirthdayRequestBody = z.infer<typeof UpdateBirthdayRequestBody>;

const GetBirthdayResponse = z
	.object({
		month: z.number(),
		day: z.number(),
		editable: z.boolean(),
		editableUntil: z.string(),
	})
	.nullable();

export type GetBirthdayResponse = z.infer<typeof GetBirthdayResponse>;

export const UpdateServerBirthdayConfigRequestBody = z.object({
	channelId: z.string().nullable(),
	timezone: z.string().nullable(),
	messageTemplate: z.string().nullable().optional(),
	eventNameTemplate: z.string().nullable().optional(),
	eventDescriptionTemplate: z.string().nullable().optional(),
});

export type UpdateServerBirthdayConfigRequestBody = z.infer<
	typeof UpdateServerBirthdayConfigRequestBody
>;
```

- [ ] **Step 2: Extend `ServerDataDb` with the config columns**

In `src/shared/src/types/index.ts`, find the `ServerDataDb` object (currently ends with `tags: z.array(Tag).nullable(),`) and add the five fields before the closing `});`:
```ts
	tags: z.array(Tag).nullable(),
	birthdayChannelId: z.string().nullable(),
	birthdayTimezone: z.string().nullable(),
	birthdayMessageTemplate: z.string().nullable(),
	birthdayEventNameTemplate: z.string().nullable(),
	birthdayEventDescriptionTemplate: z.string().nullable(),
});
```

- [ ] **Step 3: Build the shared package**

Run: `cd src/shared && pnpm build && cd ../..`
Expected: `tsc` exits 0; `src/shared/dist/types/index.js` now exports the new symbols.

- [ ] **Step 4: Commit**

```bash
git add src/shared/src/types/index.ts src/shared/dist
git commit -m "feat(shared): birthday request/response schemas + ServerDataDb config fields"
```

---

### Task 3: Database schema & migration

**Files:**
- Create: `src/server/src/db/schema/birthdays.ts`
- Modify: `src/server/src/db/schema/servers.ts`
- Modify: `src/server/src/db/schemas.ts`

**Interfaces:**
- Produces: tables `birthdays { userId(PK), month, day, createdAt }`, `birthdayAnnouncements { id, serverId(FK), userId, year, discordEventId, announcedAt }` with `unique(serverId, userId, year)`; `servers` gains `birthdayChannelId`, `birthdayTimezone`, `birthdayMessageTemplate`, `birthdayEventNameTemplate`, `birthdayEventDescriptionTemplate` (all nullable text). Available as `db.query.birthdays` / `db.query.birthdayAnnouncements`.

- [ ] **Step 1: Create the birthdays + ledger schema**

Create `src/server/src/db/schema/birthdays.ts`:
```ts
import {
	index,
	integer,
	pgTable,
	serial,
	smallint,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { servers } from "./servers.js";

// Global per-user birthday (month + day only). No FK: user identity is global.
export const birthdays = pgTable(
	"birthdays",
	{
		userId: text("user_id").notNull().primaryKey(),
		month: smallint("month").notNull(),
		day: smallint("day").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [index("birthdays_month_day_idx").on(table.month, table.day)],
);

// Idempotency ledger: at most one event + one message per user/server/year.
export const birthdayAnnouncements = pgTable(
	"birthday_announcements",
	{
		id: serial("id").primaryKey(),
		serverId: text("server_id")
			.notNull()
			.references(() => servers.serverId, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		year: integer("year").notNull(),
		discordEventId: text("discord_event_id"),
		announcedAt: timestamp("announced_at"),
	},
	(table) => [
		uniqueIndex("birthday_announcements_server_user_year_idx").on(
			table.serverId,
			table.userId,
			table.year,
		),
	],
);
```

- [ ] **Step 2: Add the config columns to `servers`**

In `src/server/src/db/schema/servers.ts`, add five nullable columns inside the `pgTable("servers", { ... })` object, after the `verificationRequired` field:
```ts
	verificationRequired: boolean("verification_required")
		.notNull()
		.default(false),
	birthdayChannelId: text("birthday_channel_id"),
	birthdayTimezone: text("birthday_timezone"),
	birthdayMessageTemplate: text("birthday_message_template"),
	birthdayEventNameTemplate: text("birthday_event_name_template"),
	birthdayEventDescriptionTemplate: text("birthday_event_description_template"),
});
```
(The `serversRelations` block below stays unchanged.)

- [ ] **Step 3: Export the new tables from the barrel**

In `src/server/src/db/schemas.ts`, add the birthdays export (keep alphabetical-ish order):
```ts
export * from "./schema/birthdays.js";
export * from "./schema/categories.js";
export * from "./schema/games.js";
export * from "./schema/roles.js";
export * from "./schema/servers.js";
export * from "./schema/tags.js";
```

- [ ] **Step 4: Verify the schema type-checks**

Run: `cd src/server && pnpm build && cd ../..`
Expected: `tsc` exits 0.

- [ ] **Step 5: Generate the migration SQL**

Run: `cd src/server && pnpm db:generate && cd ../..`
Expected: a new file under `src/server/drizzle/` (e.g. `0001_*.sql`) creating `birthdays`, `birthday_announcements`, and `ALTER TABLE servers ADD COLUMN ...` for the five columns. (Generation reads the schema only; it does not need a live database.)

- [ ] **Step 6: Commit**

```bash
git add src/server/src/db/schema/birthdays.ts src/server/src/db/schema/servers.ts src/server/src/db/schemas.ts src/server/drizzle
git commit -m "feat(server): birthdays + ledger tables and server birthday config columns"
```

---

### Task 4: Birthday decision core (pure)

**Files:**
- Create: `src/server/src/functions/birthday-core.ts`
- Test: `src/server/test/birthday-core.test.ts`

**Interfaces:**
- Produces:
  - `isValidTimezone(tz: string | null | undefined): boolean`
  - `birthdayOccursOn(b: { month: number; day: number }, dt: DateTime): boolean`
  - `isBirthdayEditable(createdAt: Date, nowMillis: number): boolean`
  - `editableUntil(createdAt: Date): string`
  - `actionKey(serverId, userId, year, type): string`
  - `computeBirthdayActions(servers: BirthdayServer[], birthdays: BirthdayRecord[], doneKeys: Set<string>, nowMillis: number): BirthdayAction[]`
  - types `BirthdayServer { serverId; timezone }`, `BirthdayRecord { userId; month; day }`, `BirthdayAction { type: "announce"|"event"; serverId; userId; year }`, constants `ANNOUNCE_HOUR = 9`, `EVENT_LEAD_DAYS = 7`
- Consumes: `luxon`.

- [ ] **Step 1: Write the failing tests**

Create `src/server/test/birthday-core.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd src/server && pnpm test && cd ../..`
Expected: FAIL — cannot resolve `../src/functions/birthday-core.js`.

- [ ] **Step 3: Implement the core**

Create `src/server/src/functions/birthday-core.ts`:
```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd src/server && pnpm test && cd ../..`
Expected: PASS — all birthday-core tests green.

- [ ] **Step 5: Commit**

```bash
git add src/server/src/functions/birthday-core.ts src/server/test/birthday-core.test.ts
git commit -m "feat(server): pure birthday decision core with tests"
```

---

### Task 5: Templating (pure, Handlebars)

**Files:**
- Create: `src/server/src/functions/birthday-templates.ts`
- Test: `src/server/test/birthday-templates.test.ts`

**Interfaces:**
- Produces:
  - interface `BirthdayContext { member: {...}; guild: {...}; birthday: { month; day } }`
  - type `TemplateKind = "message" | "eventName" | "eventDescription"`
  - `DEFAULT_MESSAGE_TEMPLATE`, `DEFAULT_EVENT_NAME_TEMPLATE`, `DEFAULT_EVENT_DESCRIPTION_TEMPLATE` (strings)
  - `TEMPLATE_LIMITS: Record<TemplateKind, number>`
  - `renderTemplate(template: string, ctx: BirthdayContext): string`
  - `buildMockContext(): BirthdayContext`
  - `validateTemplate(template: string, kind: TemplateKind): { ok: true } | { ok: false; error: string }`
- Consumes: `handlebars`.

- [ ] **Step 1: Write the failing tests**

Create `src/server/test/birthday-templates.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import {
	buildMockContext,
	DEFAULT_MESSAGE_TEMPLATE,
	renderTemplate,
	validateTemplate,
} from "../src/functions/birthday-templates.js";

describe("renderTemplate", () => {
	it("substitutes whitelisted member/guild fields", () => {
		const out = renderTemplate(
			"{{member.displayName}} @ {{guild.name}}",
			buildMockContext(),
		);
		expect(out).toBe("Sample User @ Sample Server");
	});

	it("renders the default message with a mention", () => {
		const out = renderTemplate(DEFAULT_MESSAGE_TEMPLATE, buildMockContext());
		expect(out).toContain("<@123>");
	});

	it("throws on an unknown variable (strict mode)", () => {
		expect(() => renderTemplate("{{member.naem}}", buildMockContext())).toThrow();
	});
});

describe("validateTemplate", () => {
	it("accepts a valid template", () => {
		expect(validateTemplate("hi {{member.displayName}}", "message")).toEqual({ ok: true });
	});

	it("rejects unknown variables", () => {
		const res = validateTemplate("{{member.bogus}}", "message");
		expect(res.ok).toBe(false);
	});

	it("rejects output longer than the kind limit", () => {
		const res = validateTemplate("{{guild.name}}".padEnd(120, "x"), "eventName");
		expect(res.ok).toBe(false);
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd src/server && pnpm test && cd ../..`
Expected: FAIL — cannot resolve `birthday-templates.js`.

- [ ] **Step 3: Implement the templating module**

Create `src/server/src/functions/birthday-templates.ts`:
```ts
import Handlebars from "handlebars";

export interface BirthdayContext {
	member: {
		id: string;
		mention: string;
		displayName: string;
		username: string;
		globalName: string | null;
		nickname: string | null;
		joinedAt: string | null;
		avatarURL: string | null;
		roleNames: string[];
	};
	guild: {
		id: string;
		name: string;
		memberCount: number;
		description: string | null;
		iconURL: string | null;
		ownerId: string;
		createdAt: string | null;
	};
	birthday: { month: number; day: number };
}

export type TemplateKind = "message" | "eventName" | "eventDescription";

export const DEFAULT_MESSAGE_TEMPLATE =
	"🎉 Happy birthday {{member.mention}}! Everyone wish {{member.displayName}} a great day! 🎂";
export const DEFAULT_EVENT_NAME_TEMPLATE = "🎂 {{member.displayName}}'s Birthday";
export const DEFAULT_EVENT_DESCRIPTION_TEMPLATE =
	"Wish {{member.displayName}} a happy birthday! 🎉";

export const TEMPLATE_LIMITS: Record<TemplateKind, number> = {
	message: 2000,
	eventName: 100,
	eventDescription: 1000,
};

// Isolated instance — no global helpers registered, so knownHelpersOnly is safe.
const hb = Handlebars.create();

export function renderTemplate(template: string, context: BirthdayContext): string {
	const compiled = hb.compile(template, {
		strict: true,
		noEscape: true,
		knownHelpersOnly: true,
	});
	return compiled(context, {
		allowProtoPropertiesByDefault: false,
		allowProtoMethodsByDefault: false,
	});
}

export function buildMockContext(): BirthdayContext {
	return {
		member: {
			id: "123",
			mention: "<@123>",
			displayName: "Sample User",
			username: "sample",
			globalName: "Sample",
			nickname: "Sammy",
			joinedAt: "2024-01-01T00:00:00.000Z",
			avatarURL: "https://example.com/a.png",
			roleNames: ["Member"],
		},
		guild: {
			id: "456",
			name: "Sample Server",
			memberCount: 100,
			description: "A server",
			iconURL: "https://example.com/i.png",
			ownerId: "789",
			createdAt: "2020-01-01T00:00:00.000Z",
		},
		birthday: { month: 6, day: 27 },
	};
}

export type TemplateValidation = { ok: true } | { ok: false; error: string };

export function validateTemplate(
	template: string,
	kind: TemplateKind,
): TemplateValidation {
	let rendered: string;
	try {
		rendered = renderTemplate(template, buildMockContext());
	} catch (e) {
		return { ok: false, error: (e as Error).message };
	}
	if (rendered.length > TEMPLATE_LIMITS[kind]) {
		return {
			ok: false,
			error: `Rendered ${kind} exceeds ${TEMPLATE_LIMITS[kind]} characters.`,
		};
	}
	return { ok: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd src/server && pnpm test && cd ../..`
Expected: PASS — birthday-templates tests green.

- [ ] **Step 5: Commit**

```bash
git add src/server/src/functions/birthday-templates.ts src/server/test/birthday-templates.test.ts
git commit -m "feat(server): handlebars birthday templating + validation with tests"
```

---

### Task 6: Context builder (the security boundary)

**Files:**
- Create: `src/server/src/functions/birthday-context.ts`
- Test: `src/server/test/birthday-context.test.ts`

**Interfaces:**
- Produces: `buildBirthdayContext(member: GuildMember, guild: Guild, birthday: { month; day }): BirthdayContext`
- Consumes: `BirthdayContext` (type-only) from `./birthday-templates.js`; discord.js types (type-only).

- [ ] **Step 1: Write the failing tests (including the whitelist boundary)**

Create `src/server/test/birthday-context.test.ts`:
```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd src/server && pnpm test && cd ../..`
Expected: FAIL — cannot resolve `birthday-context.js`.

- [ ] **Step 3: Implement the context builder**

Create `src/server/src/functions/birthday-context.ts`:
```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd src/server && pnpm test && cd ../..`
Expected: PASS — boundary tests green.

- [ ] **Step 5: Commit**

```bash
git add src/server/src/functions/birthday-context.ts src/server/test/birthday-context.test.ts
git commit -m "feat(server): whitelisted birthday context builder with leak test"
```

---

### Task 7: Shared validation test (zod ↔ helper)

**Files:**
- Test: `src/server/test/birthday-validation.test.ts`

**Interfaces:**
- Consumes: `isValidMonthDay`, `UpdateBirthdayRequestBody` from `juicer-shared` (built in Task 2).

- [ ] **Step 1: Write the test**

Create `src/server/test/birthday-validation.test.ts`:
```ts
import { isValidMonthDay, UpdateBirthdayRequestBody } from "juicer-shared";
import { describe, expect, it } from "vitest";

describe("isValidMonthDay", () => {
	it("accepts normal dates and Feb 29", () => {
		expect(isValidMonthDay(6, 27)).toBe(true);
		expect(isValidMonthDay(2, 29)).toBe(true);
	});
	it("rejects impossible dates", () => {
		expect(isValidMonthDay(2, 30)).toBe(false);
		expect(isValidMonthDay(4, 31)).toBe(false);
		expect(isValidMonthDay(13, 1)).toBe(false);
		expect(isValidMonthDay(6, 0)).toBe(false);
	});
});

describe("UpdateBirthdayRequestBody", () => {
	it("parses a valid body", () => {
		expect(UpdateBirthdayRequestBody.safeParse({ month: 6, day: 27 }).success).toBe(true);
	});
	it("rejects an invalid combination", () => {
		expect(UpdateBirthdayRequestBody.safeParse({ month: 2, day: 30 }).success).toBe(false);
	});
});
```

- [ ] **Step 2: Run the test**

Run: `cd src/server && pnpm test && cd ../..`
Expected: PASS. (If `juicer-shared` import fails, run `cd src/shared && pnpm build` — Task 2 — first.)

- [ ] **Step 3: Commit**

```bash
git add src/server/test/birthday-validation.test.ts
git commit -m "test(server): shared month/day validation"
```

---

### Task 8: Database access functions

**Files:**
- Modify: `src/server/src/functions/db.ts`

**Interfaces:**
- Consumes: `isBirthdayEditable` from `./birthday-core.js`; tables from `../db/schemas.js`.
- Produces:
  - `getBirthday(userId: string): Promise<BirthdayRow | null>`
  - `upsertBirthday({ userId, month, day }): Promise<BirthdayRow>` (throws `HTTPException(403)` when locked)
  - `updateServerBirthdayConfig({ serverId, channelId, timezone, messageTemplate?, eventNameTemplate?, eventDescriptionTemplate? }): Promise<ServerRow>`
  - `getEnabledBirthdayServers(): Promise<ServerRow[]>`
  - `getAllBirthdays(): Promise<BirthdayRow[]>`
  - `getBirthdayAnnouncements(serverId: string, years: number[]): Promise<LedgerRow[]>`
  - `markBirthdayEventCreated(serverId, userId, year, discordEventId): Promise<void>`
  - `markBirthdayAnnounced(serverId, userId, year): Promise<void>`
  - exported types `ServerRow`, `BirthdayRow`

- [ ] **Step 1: Extend the imports**

In `src/server/src/functions/db.ts`, update the drizzle-orm import to add `isNotNull`:
```ts
import { and, DrizzleQueryError, eq, ilike, inArray, isNotNull } from "drizzle-orm";
```
Update the schema import to add the new tables:
```ts
import {
	birthdayAnnouncements,
	birthdays,
	categories,
	games,
	gamesRoles,
	gamesTags,
	roleCategories,
	roles,
	servers,
	tags,
} from "../db/schemas.js";
```
Add the core helper import (after the existing imports near the top):
```ts
import { isBirthdayEditable } from "./birthday-core.js";
```

- [ ] **Step 2: Append the birthday DB functions**

Add to the end of `src/server/src/functions/db.ts`:
```ts
// ── Birthdays ───────────────────────────────────────────────────────────

export type ServerRow = typeof servers.$inferSelect;
export type BirthdayRow = typeof birthdays.$inferSelect;
export type BirthdayLedgerRow = typeof birthdayAnnouncements.$inferSelect;

export const getBirthday = async (
	userId: string,
): Promise<BirthdayRow | null> => {
	const row = await db.query.birthdays.findFirst({
		where: eq(birthdays.userId, userId),
	});
	return row ?? null;
};

export const upsertBirthday = async ({
	userId,
	month,
	day,
}: {
	userId: string;
	month: number;
	day: number;
}): Promise<BirthdayRow> => {
	const existing = await db.query.birthdays.findFirst({
		where: eq(birthdays.userId, userId),
	});
	if (existing && !isBirthdayEditable(existing.createdAt, Date.now())) {
		throw new HTTPException(403, {
			message: "Birthday can no longer be changed (edit window closed).",
		});
	}
	// createdAt stays the original first-set time (not in the update set), so it
	// remains the edit-window anchor across edits.
	const [row] = await db
		.insert(birthdays)
		.values({ userId, month, day })
		.onConflictDoUpdate({ target: birthdays.userId, set: { month, day } })
		.returning();
	return row;
};

export const updateServerBirthdayConfig = async ({
	serverId,
	channelId,
	timezone,
	messageTemplate,
	eventNameTemplate,
	eventDescriptionTemplate,
}: {
	serverId: string;
	channelId: string | null;
	timezone: string | null;
	messageTemplate?: string | null;
	eventNameTemplate?: string | null;
	eventDescriptionTemplate?: string | null;
}): Promise<ServerRow> => {
	const [row] = await db
		.update(servers)
		.set({
			birthdayChannelId: channelId,
			birthdayTimezone: timezone,
			birthdayMessageTemplate: messageTemplate ?? null,
			birthdayEventNameTemplate: eventNameTemplate ?? null,
			birthdayEventDescriptionTemplate: eventDescriptionTemplate ?? null,
		})
		.where(eq(servers.serverId, serverId))
		.returning();
	return row;
};

export const getEnabledBirthdayServers = async (): Promise<ServerRow[]> => {
	return await db.query.servers.findMany({
		where: isNotNull(servers.birthdayChannelId),
	});
};

export const getAllBirthdays = async (): Promise<BirthdayRow[]> => {
	return await db.query.birthdays.findMany();
};

export const getBirthdayAnnouncements = async (
	serverId: string,
	years: number[],
): Promise<BirthdayLedgerRow[]> => {
	if (years.length === 0) return [];
	return await db.query.birthdayAnnouncements.findMany({
		where: and(
			eq(birthdayAnnouncements.serverId, serverId),
			inArray(birthdayAnnouncements.year, years),
		),
	});
};

export const markBirthdayEventCreated = async (
	serverId: string,
	userId: string,
	year: number,
	discordEventId: string,
): Promise<void> => {
	await db
		.insert(birthdayAnnouncements)
		.values({ serverId, userId, year, discordEventId })
		.onConflictDoUpdate({
			target: [
				birthdayAnnouncements.serverId,
				birthdayAnnouncements.userId,
				birthdayAnnouncements.year,
			],
			set: { discordEventId },
		});
};

export const markBirthdayAnnounced = async (
	serverId: string,
	userId: string,
	year: number,
): Promise<void> => {
	const announcedAt = new Date();
	await db
		.insert(birthdayAnnouncements)
		.values({ serverId, userId, year, announcedAt })
		.onConflictDoUpdate({
			target: [
				birthdayAnnouncements.serverId,
				birthdayAnnouncements.userId,
				birthdayAnnouncements.year,
			],
			set: { announcedAt },
		});
};
```

- [ ] **Step 3: Verify it builds**

Run: `cd src/server && pnpm build && cd ../..`
Expected: `tsc` exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/server/src/functions/db.ts
git commit -m "feat(server): birthday + ledger DB access functions"
```

---

### Task 9: Discord operations

**Files:**
- Modify: `src/server/src/functions/discord-bot.ts`

**Interfaces:**
- Produces:
  - `createBirthdayScheduledEvent(serverId, name, description, start: Date, end: Date): Promise<string | null>` (returns the event id)
  - `postBirthdayMessage(serverId, channelId, content): Promise<boolean>`
  - `fetchMemberIfPresent(serverId, userId): Promise<GuildMember | null>`
  - `getGuildForBirthday(serverId): Promise<Guild | undefined>`
  - `assertBirthdayChannelSendable(serverId, channelId): Promise<void>` (throws `HTTPException`)
- Consumes: existing `resolveGuild`, `discordClient`.

- [ ] **Step 1: Add the discord.js enum imports**

In `src/server/src/functions/discord-bot.ts`, extend the `discord.js` value import to add the scheduled-event enums:
```ts
import {
	ChannelType,
	Client,
	DiscordAPIError,
	Events,
	GatewayIntentBits,
	GuildScheduledEventEntityType,
	GuildScheduledEventPrivacyLevel,
	PermissionFlagsBits,
} from "discord.js";
```
And add `Guild` to the type-only import at the top:
```ts
import type {
	Collection,
	Client as DiscordClient,
	Guild,
	GuildMember,
	Role,
	Snowflake,
} from "discord.js";
```

- [ ] **Step 2: Append the birthday Discord helpers**

Add to the end of `src/server/src/functions/discord-bot.ts`:
```ts
// ── Birthday operations ─────────────────────────────────────────────────

export const getGuildForBirthday = async (
	serverId: string,
): Promise<Guild | undefined> => {
	return await resolveGuild(serverId);
};

export const fetchMemberIfPresent = async (
	serverId: string,
	userId: string,
): Promise<GuildMember | null> => {
	const guild = await resolveGuild(serverId);
	if (!guild) return null;
	try {
		return await guild.members.fetch({ user: userId });
	} catch {
		// User is no longer in the guild (or fetch failed) — treat as absent.
		return null;
	}
};

export const createBirthdayScheduledEvent = async (
	serverId: string,
	name: string,
	description: string | null,
	start: Date,
	end: Date,
): Promise<string | null> => {
	const guild = await resolveGuild(serverId);
	if (!guild) return null;
	const event = await guild.scheduledEvents.create({
		name,
		description: description ?? undefined,
		scheduledStartTime: start,
		scheduledEndTime: end,
		privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
		entityType: GuildScheduledEventEntityType.External,
		entityMetadata: { location: "🎉" },
	});
	return event.id;
};

export const postBirthdayMessage = async (
	serverId: string,
	channelId: string,
	content: string,
): Promise<boolean> => {
	const guild = await resolveGuild(serverId);
	if (!guild) return false;
	const channel =
		guild.channels.cache.get(channelId) ??
		(await guild.channels.fetch(channelId));
	if (!channel || channel.type !== ChannelType.GuildText) return false;
	await channel.send(content);
	return true;
};

// Used by the admin config endpoint to fail fast if the chosen channel is
// unusable, before the feature is enabled.
export const assertBirthdayChannelSendable = async (
	serverId: string,
	channelId: string,
): Promise<void> => {
	const guild = await resolveGuild(serverId);
	if (!guild) {
		throw new HTTPException(404, {
			message: "Server not found. Bot may not be in that server.",
		});
	}
	const channel =
		guild.channels.cache.get(channelId) ??
		(await guild.channels.fetch(channelId));
	if (!channel || channel.type !== ChannelType.GuildText) {
		throw new HTTPException(400, {
			message: "Announcement channel must be a text channel.",
		});
	}
	const me = await guild.members.fetchMe();
	const perms = channel.permissionsFor(me);
	if (
		!perms?.has(PermissionFlagsBits.ViewChannel) ||
		!perms?.has(PermissionFlagsBits.SendMessages)
	) {
		throw new HTTPException(400, {
			message: "Bot cannot send messages in that channel.",
		});
	}
};
```
(`HTTPException` and `ChannelType`/`PermissionFlagsBits` are already imported in this file.)

- [ ] **Step 3: Verify it builds**

Run: `cd src/server && pnpm build && cd ../..`
Expected: `tsc` exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/server/src/functions/discord-bot.ts
git commit -m "feat(server): discord birthday event/message + channel checks"
```

---

### Task 10: Scheduler & wiring

**Files:**
- Create: `src/server/src/functions/birthday-scheduler.ts`
- Modify: `src/server/src/index.ts`

**Interfaces:**
- Produces: `runBirthdayTick(): Promise<void>`, `startBirthdayScheduler(): void`
- Consumes: core, templates, context, db, discord-bot helpers from earlier tasks; `node-cron`, `luxon`.

- [ ] **Step 1: Implement the scheduler**

Create `src/server/src/functions/birthday-scheduler.ts`:
```ts
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
```

- [ ] **Step 2: Wire it into server boot**

In `src/server/src/index.ts`, add the import alongside the route imports:
```ts
import { startBirthdayScheduler } from "./functions/birthday-scheduler.js";
```
Then start it inside the `serve` callback so it runs once the process is up:
```ts
serve(
	{
		fetch: app.fetch,
		port: 8000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
		startBirthdayScheduler();
	},
);
```

- [ ] **Step 3: Verify it builds**

Run: `cd src/server && pnpm build && cd ../..`
Expected: `tsc` exits 0. (If `import * as cron` produces a call-signature error, change it to `import cron from "node-cron";` — both forms are accepted under NodeNext; the namespace form is the default here.)

- [ ] **Step 4: Run the full server test suite (no regressions)**

Run: `cd src/server && pnpm test && cd ../..`
Expected: PASS — all prior tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/server/src/functions/birthday-scheduler.ts src/server/src/index.ts
git commit -m "feat(server): hourly birthday scheduler wired into boot"
```

---

### Task 11: User birthday routes

**Files:**
- Modify: `src/server/src/routes/discord/user.ts`

**Interfaces:**
- Produces: `GET /discord/user/me/birthday` → `GetBirthdayResponse`; `PUT /discord/user/me/birthday` (`{ month, day }`) → the same shape.
- Consumes: `getBirthday`, `upsertBirthday`, `isBirthdayEditable`, `editableUntil`, `UpdateBirthdayRequestBody`.

- [ ] **Step 1: Add imports**

In `src/server/src/routes/discord/user.ts`, add below the existing imports:
```ts
import { zValidator } from "@hono/zod-validator";
import { UpdateBirthdayRequestBody } from "juicer-shared/dist/types/index.js";
import { editableUntil, isBirthdayEditable } from "../../functions/birthday-core.js";
import { getBirthday, upsertBirthday } from "../../functions/db.js";
```

- [ ] **Step 2: Add the routes**

In `src/server/src/routes/discord/user.ts`, add before `export default app;`:
```ts
app.get("/me/birthday", async (c) => {
	const accessToken = getCookie(c, "discord_access_token");
	if (!accessToken) {
		throw new HTTPException(401, { message: "Unauthorized" });
	}
	const userData = await getDiscordOAuthUserData(accessToken as string);
	const row = await getBirthday(userData.id);
	if (!row) return c.json(null);
	return c.json({
		month: row.month,
		day: row.day,
		editable: isBirthdayEditable(row.createdAt, Date.now()),
		editableUntil: editableUntil(row.createdAt),
	});
});

app.put(
	"/me/birthday",
	zValidator("json", UpdateBirthdayRequestBody),
	async (c) => {
		const accessToken = getCookie(c, "discord_access_token");
		if (!accessToken) {
			throw new HTTPException(401, { message: "Unauthorized" });
		}
		const userData = await getDiscordOAuthUserData(accessToken as string);
		const body = c.req.valid("json");
		const row = await upsertBirthday({
			userId: userData.id,
			month: body.month,
			day: body.day,
		});
		return c.json({
			month: row.month,
			day: row.day,
			editable: isBirthdayEditable(row.createdAt, Date.now()),
			editableUntil: editableUntil(row.createdAt),
		});
	},
);
```

- [ ] **Step 3: Verify it builds**

Run: `cd src/server && pnpm build && cd ../..`
Expected: `tsc` exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/server/src/routes/discord/user.ts
git commit -m "feat(server): GET/PUT /discord/user/me/birthday"
```

---

### Task 12: Admin birthday-config route

**Files:**
- Modify: `src/server/src/routes/discord/server/index.ts`

**Interfaces:**
- Produces: `PUT /discord/servers/:serverId/birthday-config` (admin-gated) → updated `ServerRow`.
- Consumes: `updateServerBirthdayConfig`, `assertBirthdayChannelSendable`, `isValidTimezone`, `validateTemplate`, `UpdateServerBirthdayConfigRequestBody`.

- [ ] **Step 1: Add imports**

In `src/server/src/routes/discord/server/index.ts`, extend the `juicer-shared` import and the function imports:
```ts
import {
	UpdateServerBirthdayConfigRequestBody,
	UpdateServerVerificationRequiredRequestBody,
} from "juicer-shared/dist/types/index.js";
```
Add to the `../../../functions/db.js` import list: `updateServerBirthdayConfig`. Add to the `../../../functions/discord-bot.js` import list: `assertBirthdayChannelSendable`. Then add two new imports:
```ts
import { isValidTimezone } from "../../../functions/birthday-core.js";
import { validateTemplate } from "../../../functions/birthday-templates.js";
```

- [ ] **Step 2: Add the route**

In `src/server/src/routes/discord/server/index.ts`, add after the existing `app.put("/:serverId", ...)` block and before the `app.route(...)` lines:
```ts
app.put(
	"/:serverId/birthday-config",
	zValidator("json", UpdateServerBirthdayConfigRequestBody),
	async (c) => {
		const serverId = c.req.param("serverId");
		const body = c.req.valid("json");
		const accessToken = getCookie(c, "discord_access_token");
		const { manageGuildPermission } = await authenticateAndAuthorizeUser(
			serverId,
			accessToken as string,
			true,
		);
		if (!manageGuildPermission) {
			throw new HTTPException(403, {
				message: "User does not have manage server permission.",
			});
		}

		// When enabling (channel set), require a valid timezone, a sendable
		// channel, and valid templates. Clearing the channel disables the feature.
		if (body.channelId) {
			if (!body.timezone || !isValidTimezone(body.timezone)) {
				throw new HTTPException(400, {
					message: "A valid IANA timezone is required to enable birthday announcements.",
				});
			}
			await assertBirthdayChannelSendable(serverId, body.channelId);
			const checks: Array<
				[string | null | undefined, "message" | "eventName" | "eventDescription"]
			> = [
				[body.messageTemplate, "message"],
				[body.eventNameTemplate, "eventName"],
				[body.eventDescriptionTemplate, "eventDescription"],
			];
			for (const [tpl, kind] of checks) {
				if (tpl) {
					const res = validateTemplate(tpl, kind);
					if (!res.ok) {
						throw new HTTPException(400, {
							message: `Invalid ${kind} template: ${res.error}`,
						});
					}
				}
			}
		}

		const updated = await updateServerBirthdayConfig({
			serverId,
			channelId: body.channelId,
			timezone: body.timezone,
			messageTemplate: body.messageTemplate,
			eventNameTemplate: body.eventNameTemplate,
			eventDescriptionTemplate: body.eventDescriptionTemplate,
		});
		return c.json(updated, 200);
	},
);
```

- [ ] **Step 3: Verify it builds**

Run: `cd src/server && pnpm build && cd ../..`
Expected: `tsc` exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/server/src/routes/discord/server/index.ts
git commit -m "feat(server): admin PUT /birthday-config with validation"
```

---

### Task 13: Client remotes

**Files:**
- Modify: `src/client/src/remotes/remotes.tsx`

**Interfaces:**
- Produces:
  - `_fetchMyBirthday(): Promise<GetBirthdayResponse>` with `.apiPath()` / `.query()`
  - `_updateMyBirthday(month, day): Promise<GetBirthdayResponse>`
  - `_updateServerBirthdayConfig(serverId, config): Promise<ServerDataDb>`

- [ ] **Step 1: Extend the type import**

In `src/client/src/remotes/remotes.tsx`, add `GetBirthdayResponse` to the `juicer-shared` type import:
```ts
import type {
	Game,
	GetBirthdayResponse,
	GuildMember,
	MessageOnSuccess,
	MyInfo,
	Role,
	RoleCategory,
	ServerData,
	ServerDataDb,
	SyncRolesResponse,
} from "juicer-shared";
```

- [ ] **Step 2: Append the remote functions**

Add to the end of `src/client/src/remotes/remotes.tsx`:
```ts
export const _fetchMyBirthday = async (): Promise<GetBirthdayResponse> => {
	const _res = await axios.get(_fetchMyBirthday.apiPath(), {
		withCredentials: true,
	});
	return _res.data;
};

_fetchMyBirthday.apiPath = () => {
	return `${import.meta.env.VITE_BACKEND_URI}/discord/user/me/birthday`;
};

_fetchMyBirthday.query = () => {
	return {
		queryKey: ["myBirthday"],
		queryFn: _fetchMyBirthday,
	};
};

export const _updateMyBirthday = async (
	month: number,
	day: number,
): Promise<GetBirthdayResponse> => {
	const _res = await axios.put(
		`${import.meta.env.VITE_BACKEND_URI}/discord/user/me/birthday`,
		{ month, day },
		{ withCredentials: true },
	);
	return _res.data;
};

export const _updateServerBirthdayConfig = async (
	serverId: string,
	config: {
		channelId: string | null;
		timezone: string | null;
		messageTemplate?: string | null;
		eventNameTemplate?: string | null;
		eventDescriptionTemplate?: string | null;
	},
): Promise<ServerDataDb> => {
	const _res = await axios.put(
		`${import.meta.env.VITE_BACKEND_URI}/discord/servers/${serverId}/birthday-config`,
		config,
		{ withCredentials: true },
	);
	return _res.data;
};
```

- [ ] **Step 3: Verify the client builds**

Run: `cd src/client && pnpm build && cd ../..`
Expected: `tsc -b && vite build` succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/client/src/remotes/remotes.tsx
git commit -m "feat(client): birthday + birthday-config remotes"
```

---

### Task 14: Dashboard birthday card

**Files:**
- Create: `src/client/src/pages/Dashboard/BirthdayCard.tsx`
- Modify: `src/client/src/pages/Dashboard/Dashboard.tsx`

**Interfaces:**
- Consumes: `_fetchMyBirthday`, `_updateMyBirthday`, `useToast`, `Card`, `Button`.
- Produces: `<BirthdayCard />` component (no props).

- [ ] **Step 1: Create the card component**

Create `src/client/src/pages/Dashboard/BirthdayCard.tsx`:
```tsx
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { _fetchMyBirthday, _updateMyBirthday } from "../../remotes/remotes";
import { Button } from "../../ui/components/Button";
import { Card } from "../../ui/components/Card";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const BirthdayCard = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const _birthdayQuery = useQuery(_fetchMyBirthday.query());
	const birthday = _birthdayQuery.data;

	const [month, setMonth] = useState<number>(1);
	const [day, setDay] = useState<number>(1);
	const [saving, setSaving] = useState<boolean>(false);

	// Seed the selects from the loaded birthday once it arrives.
	useEffect(() => {
		if (birthday) {
			setMonth(birthday.month);
			setDay(birthday.day);
		}
	}, [birthday]);

	const locked = !!birthday && !birthday.editable;

	const save = async () => {
		setSaving(true);
		try {
			await _updateMyBirthday(month, day);
			await queryClient.invalidateQueries({ queryKey: ["myBirthday"] });
			showToast("생일을 저장했어요.", "success");
		} catch (e) {
			const message = isAxiosError(e)
				? (e.response?.data?.message ?? "생일을 저장하지 못했어요.")
				: "생일을 저장하지 못했어요.";
			showToast(message, "error");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card
			css={{
				border: "1px solid rgba(255, 255, 255, 0.66)",
				display: "flex",
				flexDirection: "column",
				gap: "12px",
			}}
		>
			<h2 css={{ margin: 0 }}>내 생일</h2>
			<div css={{ color: "rgba(255, 255, 255, 0.66)", fontSize: "0.875rem" }}>
				생일을 설정하면 봇이 있는 서버에서 축하 메시지와 일정이 자동으로
				만들어져요. 설정 후 한 달 동안만 변경할 수 있어요.
			</div>
			<div css={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
				<select
					value={month}
					disabled={locked || saving}
					onChange={(e) => setMonth(Number(e.target.value))}
					css={{ padding: "8px", borderRadius: "8px" }}
				>
					{MONTHS.map((m) => (
						<option key={m} value={m}>
							{m}월
						</option>
					))}
				</select>
				<select
					value={day}
					disabled={locked || saving}
					onChange={(e) => setDay(Number(e.target.value))}
					css={{ padding: "8px", borderRadius: "8px" }}
				>
					{DAYS.map((d) => (
						<option key={d} value={d}>
							{d}일
						</option>
					))}
				</select>
				<Button onClick={save} disabled={locked || saving}>
					저장
				</Button>
			</div>
			{locked && birthday && (
				<div css={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}>
					변경 가능 기간이 끝나 더 이상 수정할 수 없어요.
				</div>
			)}
			{!locked && birthday && (
				<div css={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}>
					{new Date(birthday.editableUntil).toLocaleDateString()}까지 변경할 수 있어요.
				</div>
			)}
		</Card>
	);
};
```

- [ ] **Step 2: Render the card on the dashboard**

In `src/client/src/pages/Dashboard/Dashboard.tsx`, add the import after the existing component imports:
```tsx
import { BirthdayCard } from "./BirthdayCard";
```
Then render it at the top of the scrolling column. Change the opening of that `div` (currently immediately followed by `{_myInfo.guilds.map(...)}`) to insert the card first:
```tsx
					<div
						css={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							overflowY: "auto",
							maxHeight: "100%",
						}}
					>
						<BirthdayCard />
						{_myInfo.guilds.map((guild: FilteredGuild) => (
```

- [ ] **Step 3: Verify the client builds**

Run: `cd src/client && pnpm build && cd ../..`
Expected: `tsc -b && vite build` succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/client/src/pages/Dashboard/BirthdayCard.tsx src/client/src/pages/Dashboard/Dashboard.tsx
git commit -m "feat(client): birthday entry card on dashboard"
```

---

### Task 15: Admin birthday settings + bot-permissions docs

**Files:**
- Create: `src/client/src/pages/Server/BirthdayAnnouncementsSettings.tsx`
- Modify: `src/client/src/pages/Server/ServerSettings.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `_updateServerBirthdayConfig`, `useToast`, `Button`; `ServerDataDb` and channel list from server data.
- Produces: `<BirthdayAnnouncementsSettings serverId channels config />`.

- [ ] **Step 1: Create the admin settings component**

Create `src/client/src/pages/Server/BirthdayAnnouncementsSettings.tsx`:
```tsx
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import type { ServerDataDb, ServerDataDiscordChannel } from "juicer-shared";
import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { _updateServerBirthdayConfig } from "../../remotes/remotes";
import { Button } from "../../ui/components/Button";

interface Props {
	serverId: string;
	channels: ServerDataDiscordChannel[];
	config: ServerDataDb | null;
}

export const BirthdayAnnouncementsSettings = ({ serverId, channels, config }: Props) => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();

	const [channelId, setChannelId] = useState<string>(config?.birthdayChannelId ?? "");
	const [timezone, setTimezone] = useState<string>(config?.birthdayTimezone ?? "");
	const [messageTemplate, setMessageTemplate] = useState<string>(
		config?.birthdayMessageTemplate ?? "",
	);
	const [eventNameTemplate, setEventNameTemplate] = useState<string>(
		config?.birthdayEventNameTemplate ?? "",
	);
	const [eventDescriptionTemplate, setEventDescriptionTemplate] = useState<string>(
		config?.birthdayEventDescriptionTemplate ?? "",
	);
	const [saving, setSaving] = useState<boolean>(false);

	const save = async () => {
		setSaving(true);
		try {
			await _updateServerBirthdayConfig(serverId, {
				channelId: channelId === "" ? null : channelId,
				timezone: timezone === "" ? null : timezone,
				messageTemplate: messageTemplate === "" ? null : messageTemplate,
				eventNameTemplate: eventNameTemplate === "" ? null : eventNameTemplate,
				eventDescriptionTemplate:
					eventDescriptionTemplate === "" ? null : eventDescriptionTemplate,
			});
			await queryClient.invalidateQueries({ queryKey: ["serverData", serverId] });
			showToast("생일 알림 설정을 저장했어요.", "success");
		} catch (e) {
			const message = isAxiosError(e)
				? (e.response?.data?.message ?? "설정을 저장하지 못했어요.")
				: "설정을 저장하지 못했어요.";
			showToast(message, "error");
		} finally {
			setSaving(false);
		}
	};

	const fieldLabel = { fontSize: "0.875rem", color: "rgba(255,255,255,0.8)" } as const;
	const control = { padding: "8px", borderRadius: "8px", width: "100%" } as const;

	return (
		<div css={{ display: "flex", flexDirection: "column", width: "100%", gap: "12px" }}>
			<h2 css={{ margin: 0 }}>생일 알림</h2>
			<div css={{ color: "rgba(255, 255, 255, 0.66)", fontSize: "0.875rem" }}>
				알림 채널을 선택하면 기능이 켜져요. 채널을 "사용 안 함"으로 두면 꺼져요.
				멤버 생일에 축하 메시지를 보내고, 7일 전에 디스코드 일정을 만들어요.
				봇에 <b>이벤트 관리</b> 권한과 채널 <b>메시지 보내기</b> 권한이 필요해요.
			</div>

			<label css={fieldLabel}>알림 채널</label>
			<select
				value={channelId}
				disabled={saving}
				onChange={(e) => setChannelId(e.target.value)}
				css={control}
			>
				<option value="">사용 안 함</option>
				{channels.map((ch) => (
					<option key={ch.id} value={ch.id}>
						#{ch.name}
					</option>
				))}
			</select>

			<label css={fieldLabel}>시간대 (IANA, 예: Asia/Seoul)</label>
			<input
				value={timezone}
				disabled={saving}
				placeholder="Asia/Seoul"
				onChange={(e) => setTimezone(e.target.value)}
				css={control}
			/>

			<label css={fieldLabel}>
				축하 메시지 템플릿 (Handlebars · {"{{member.mention}}"}, {"{{member.displayName}}"}, {"{{guild.name}}"})
			</label>
			<textarea
				value={messageTemplate}
				disabled={saving}
				placeholder="🎉 Happy birthday {{member.mention}}! 🎂"
				onChange={(e) => setMessageTemplate(e.target.value)}
				css={{ ...control, minHeight: "64px" }}
			/>

			<label css={fieldLabel}>일정 제목 템플릿 (멘션은 일정에서 표시만 됨)</label>
			<input
				value={eventNameTemplate}
				disabled={saving}
				placeholder="🎂 {{member.displayName}}'s Birthday"
				onChange={(e) => setEventNameTemplate(e.target.value)}
				css={control}
			/>

			<label css={fieldLabel}>일정 설명 템플릿 (선택)</label>
			<textarea
				value={eventDescriptionTemplate}
				disabled={saving}
				placeholder="Wish {{member.displayName}} a happy birthday! 🎉"
				onChange={(e) => setEventDescriptionTemplate(e.target.value)}
				css={{ ...control, minHeight: "48px" }}
			/>

			<Button onClick={save} disabled={saving} css={{ alignSelf: "flex-start" }}>
				저장
			</Button>
		</div>
	);
};
```

- [ ] **Step 2: Render it in ServerSettings**

In `src/client/src/pages/Server/ServerSettings.tsx`, add the import after the existing page imports:
```tsx
import { BirthdayAnnouncementsSettings } from "./BirthdayAnnouncementsSettings";
```
Then insert the section right after the verification helper-text block and before the "분류 없는 역할" (`분류 없는 역할`) section. Find this closing of the verification helper `div`:
```tsx
						<div
							css={{ color: "rgba(255, 255, 255, 0.66)", fontSize: "0.875rem" }}
						>
							켜면 인증 역할을 가진 멤버만 주제를 보고 역할을 받을 수 있어요.
						</div>
```
and immediately after it (before the next `<div css={{ display: "flex", flexDirection: "column", width: "100%", gap: "12px" }}>` that contains `분류 없는 역할`) insert:
```tsx
						<BirthdayAnnouncementsSettings
							serverId={serverId as string}
							channels={_serverData.serverDataDiscord.channels ?? []}
							config={_serverData.serverDataDb}
						/>
```

- [ ] **Step 3: Document required bot permissions in the README**

Append to `README.md`:
```markdown
## Birthday Announcements

Users set their birthday (month + day) from the dashboard. It is editable for
one month, then locked. Each server admin enables the feature in Server Settings
by choosing an announcement channel and an IANA timezone (e.g. `Asia/Seoul`).

On a member's birthday the bot, in every enabled server the member is in:

- posts an admin-configured congrats message in the announcement channel, and
- creates a Discord scheduled event ~7 days ahead.

Messages and event text are admin-authored Handlebars templates. Available
variables: `{{member.mention}}` (message only), `{{member.displayName}}`,
`{{member.username}}`, `{{guild.name}}`, and more.

### Required bot permissions

Invite the bot with **Manage Events**, and ensure it has **View Channel** +
**Send Messages** in the chosen announcement channel. Missing permissions are
logged and skipped — the bot will not crash, but the affected message or event
will not be created.
```

- [ ] **Step 4: Verify the client builds**

Run: `cd src/client && pnpm build && cd ../..`
Expected: `tsc -b && vite build` succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/client/src/pages/Server/BirthdayAnnouncementsSettings.tsx src/client/src/pages/Server/ServerSettings.tsx README.md
git commit -m "feat(client): admin birthday settings + docs"
```

---

## Final verification

- [ ] **Build everything from the repo root**

Run: `cd src && pnpm build && cd ..`
Expected: shared, server, and client all build with zero errors.

- [ ] **Run the server test suite**

Run: `cd src/server && pnpm test && cd ../..`
Expected: all tests pass (smoke, core, templates, context, validation).

---

## Self-Review

**Spec coverage:**
- Global per-user birthday → `birthdays` table (Task 3), user routes (Task 11), dashboard card (Task 14). ✓
- 1-month edit window then locked → `isBirthdayEditable`/`editableUntil` (Task 4), enforced in `upsertBirthday` (Task 8) + surfaced in UI (Task 14). ✓
- Month + day only, Feb 29 → Feb 28 → `isValidMonthDay` (Task 2), `birthdayOccursOn` (Task 4). ✓
- Both event + message → scheduler executor (Task 10), discord ops (Task 9). ✓
- Per-server timezone, channel = on → config columns (Task 3), admin route validation (Task 12), admin UI (Task 15). ✓
- Event 7 days ahead, message at 09:00 local → `computeBirthdayActions` (Task 4), executor event window (Task 10). ✓
- Handlebars against whitelisted context → templates (Task 5) + context boundary (Task 6) + leak test (Task 6). ✓
- Save-time template/timezone/channel validation → Task 12. ✓
- Idempotency ledger → Task 3 (unique index) + Task 8 (upsert marks) + Task 10 (doneKeys). ✓
- Edge cases (user left, bad perms, bot down) → `fetchMemberIfPresent` skip (Task 9/10), try/catch per action (Task 10), `assertBirthdayChannelSendable` (Task 9/12). ✓
- Tests for pure core, templates, boundary, validation → Tasks 4–7. ✓
- README bot permissions → Task 15. ✓

**Type consistency:** `BirthdayContext` defined in Task 5, consumed type-only in Task 6 and via `renderTemplate` in Task 10. `ServerRow`/`BirthdayRow` defined in Task 8, consumed type-only in Task 10. `BirthdayAction`/`actionKey`/`EVENT_LEAD_DAYS`/`computeBirthdayActions` defined Task 4, consumed Task 10. `GetBirthdayResponse`/`UpdateBirthdayRequestBody`/`UpdateServerBirthdayConfigRequestBody`/extended `ServerDataDb` defined Task 2, consumed Tasks 11–15. Names verified consistent across tasks.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; commands have expected output. The toast API (`useToast().showToast(message, type)`) was verified against `src/client/src/contexts/ToastContext.tsx` and used directly in Tasks 14–15.
