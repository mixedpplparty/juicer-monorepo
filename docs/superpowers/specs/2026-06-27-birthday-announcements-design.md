# Birthday Announcements — Design

**Date:** 2026-06-27
**Branch:** `worktree-feat+birthday-announcements`
**Status:** Approved design, ready for implementation planning

## Summary

Let users set their own birthday (month + day) from the dashboard. Each server
admin opts the server in by choosing a public announcement channel and timezone.
On a member's birthday the bot, for every enabled server the user shares with it:

1. Creates a Discord **Guild Scheduled Event** ~7 days ahead (visible in the
   server's Events tab).
2. Posts a **congratulations message** in the admin-selected channel on the day.

Both the message and the event text are admin-authored **Handlebars templates**
rendered against a locked-down, whitelisted view-model derived from the
discord.js `GuildMember` and `Guild` objects.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Birthday scope | **Global per user** — one row per Discord user ID; fans out to every enabled server the user is a member of |
| Edit rule | **1-month edit window** — freely editable for 1 month after first set, then permanently locked |
| Precision | **Month + day only** (no year) |
| Behavior | **Both** a Discord Scheduled Event **and** a congrats message |
| Timezone | **Per-server** — admin picks an IANA timezone when enabling |
| Event timing | **~7 days ahead**; message on the day |
| Admin enable | **Channel = on** — selecting an announcement channel enables the feature; clearing it disables |
| Template engine | **Handlebars**, rendered against a whitelisted plain-object context |
| Scheduler | **In-process hourly `node-cron` job** with a DB dedupe ledger for idempotency |
| Timezone math | **luxon** |

## Architecture

The project is a pnpm monorepo under `src/`:
- `src/server` — Hono + Drizzle (Postgres) + discord.js bot. Routes under
  `/discord/...`; OAuth-cookie auth; admin actions gated by `ManageGuild`.
- `src/client` — React + MUI + TanStack.
- `src/shared` — `juicer-shared` types + zod schemas.

There is no scheduler today and no users table; the bot boots with only the
`Guilds` gateway intent. Creating scheduled events and posting messages are REST
operations gated by **permissions**, not gateway intents, so no new intent is
required — but the bot must be invited with **Manage Events** and have
**View Channel + Send Messages** on the announcement channel.

### 1. Data model (3 changes, Drizzle)

**New `birthdays` table** — global, one row per Discord user (no FK; global identity):

| Column | Type | Notes |
|---|---|---|
| `userId` | text PK | Discord user ID |
| `month` | smallint | 1–12, validated |
| `day` | smallint | 1–31, validated against the month; Feb 29 allowed |
| `createdAt` | timestamp default now | **edit-window anchor** |

Edit allowed only while `now() < createdAt + interval '1 month'`. After that the
`PUT` endpoint returns 403. `createdAt` stays the first-set time even across
edits within the window.

**Extend `servers` table** (matches the existing `verificationRequired` column pattern):

| Column | Type | Notes |
|---|---|---|
| `birthdayChannelId` | text nullable | **non-null = feature enabled** |
| `birthdayTimezone` | text nullable | IANA zone, e.g. `America/New_York` |
| `birthdayMessageTemplate` | text nullable | Handlebars; default used when null/blank |
| `birthdayEventNameTemplate` | text nullable | Handlebars; default used when null/blank |
| `birthdayEventDescriptionTemplate` | text nullable | Handlebars; empty allowed |

**New `birthdayAnnouncements` ledger** — idempotency + dedupe:

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `serverId` | text FK → servers (cascade) | |
| `userId` | text | |
| `year` | integer | which year's occurrence |
| `discordEventId` | text nullable | set once the scheduled event is created |
| `announcedAt` | timestamp nullable | set once the congrats message is posted |
| | | **unique(`serverId`, `userId`, `year`)** |

The unique constraint guarantees at-most-once event creation and at-most-once
message per user/server/year, even across restarts and hourly re-runs.

Migrations via the existing `drizzle-kit generate` + `drizzle-kit migrate`
(`pnpm db:generate` / `pnpm db:migrate`).

### 2. Templating (Handlebars)

**Security boundary — the single most important rule:** templates are **never**
rendered against live discord.js objects. Those expose `member.client.token`
(the bot token), `.guild.client`, methods, and circular refs — an admin
(ManageGuild) could traverse to secrets or trigger side effects. Instead each
render builds a flattened, whitelisted, plain-object context:

```
member:   { id, mention, displayName, username, globalName, nickname,
            joinedAt, avatarURL, roleNames }   // `mention` => <@id>, pings in messages only
guild:    { id, name, memberCount, description, iconURL, ownerId, createdAt }
birthday: { month, day }                        // no year
```

Handlebars config: `strict: true`, `noEscape: true` (Discord text, not HTML),
`allowProtoPropertiesByDefault: false` (default — blocks prototype access),
`knownHelpersOnly: true` with no custom helpers registered.

**Defaults** (used when a template field is null/blank):
- Message: `🎉 Happy birthday {{member.mention}}! Everyone wish {{member.displayName}} a great day! 🎂`
- Event name: `🎂 {{member.displayName}}'s Birthday`
- Event description: `Wish {{member.displayName}} a happy birthday! 🎉`

**Save-time validation** (in the admin config endpoint): compile each template;
render against a representative **mock context** with `strict: true` so unknown
variables (e.g. `{{member.naem}}`) are rejected immediately; enforce Discord
length limits on the mock-rendered output — event name ≤ 100, message ≤ 2000,
event description ≤ 1000. `{{member.mention}}` in an event template renders the
literal `<@id>` (events can't ping) — allowed, surfaced as a UI hint, not an error.

### 3. Scheduler & timezone

New `src/server/src/functions/birthday-scheduler.ts`, started from `index.ts` at
boot. `node-cron` runs `0 * * * *` (hourly). Each run, for every **enabled**
server (`birthdayChannelId != null`):

- Compute `localNow` in `birthdayTimezone` via luxon.
- **Congrats message** — for each user whose birthday `MM-DD` equals `localNow`'s
  date, who is a current member of the guild, with no ledger row carrying
  `announcedAt` for this `year`, and `localNow.hour >= 9` (mid-morning, not
  midnight): render the message template and post it, then write `announcedAt`.
- **Scheduled event (7 days ahead)** — for each user whose birthday `MM-DD`
  equals `(localNow + 7 days)`'s date, who is a current member, with no
  `discordEventId` for this `year`: create the all-day External event spanning
  the birthday in the server's timezone, then store `discordEventId`.

**Idempotency** comes entirely from the `(serverId, userId, year)` ledger +
unique constraint: hourly re-runs, process restarts, and a bot that was down all
post-at-most-once and **catch up late** rather than double-firing.

**Pure core for testability:**
`computeBirthdayActions(enabledServers, birthdays, ledger, nowUtc) → Action[]`
is a pure function holding all timezone / Feb-29 / lead-date logic. Discord and
DB are thin adapters around it.

### 4. Discord operations

Extend `src/server/src/functions/discord-bot.ts`:
- `buildBirthdayContext(member, guild, birthday)` → the whitelisted view-model
  (the security boundary).
- `createBirthdayScheduledEvent(...)` →
  `guild.scheduledEvents.create({ entityType: External,
  privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
  scheduledStartTime/scheduledEndTime = local all-day window, name, description })`.
- `postBirthdayMessage(channelId, rendered)` → resolve channel, verify it's a
  text channel the bot can send to, `channel.send()`.

Every Discord call is wrapped so a missing permission / deleted channel /
guild-not-cached is **logged and skipped**, never crashing the job.

### 5. API routes

**User (global) — under `/discord/user`:**
- `GET /me/birthday` → `{ month, day, editable, editableUntil } | null`
- `PUT /me/birthday` `{ month, day }` → upsert; 403 if past the edit window;
  zod-validated MM-DD (incl. valid Feb 29).

**Admin (per-server) — under `/discord/servers/:serverId`, `ManageGuild`-gated:**
- `PUT /birthday-config`
  `{ channelId, timezone, messageTemplate, eventNameTemplate, eventDescriptionTemplate }`
  → validates IANA timezone, channel existence/sendability, and each template
  (compile + strict mock-render + length). `channelId: null` disables the feature.
- Config is returned by folding the new fields into the existing `GET /:serverId`
  `serverDataDb` payload (extend `ServerDataDb`).

### 6. Frontend

- **User birthday entry** — a "Birthday" card on **Dashboard** (`pages/Dashboard/`,
  since the birthday is user-global, not server-specific): month + day selects,
  current value, an "editable until {date}" hint, and a locked read-only state.
  Uses the existing MUI + `remotes` + `ToastContext` patterns.
- **Admin config** — a "Birthday announcements" section in
  **`pages/Server/ServerSettings.tsx`**: channel dropdown (reuses
  `serverDataDiscord.channels`), timezone select, and three template textareas
  with placeholder help text and inline validation errors surfaced from the save
  endpoint.

### 7. Shared types (`juicer-shared`)

Add zod schemas + inferred types: `Birthday`, `GetBirthdayResponse`,
`UpdateBirthdayRequestBody`, `UpdateServerBirthdayConfigRequestBody`; extend
`ServerDataDb` with the birthday config fields. Validation is shared between the
`@hono/zod-validator` request guards and the client.

## Edge cases

- **Feb 29** birthdays announce on **Feb 28** in non-leap years.
- **User left the server** before the date → membership check skips the message;
  a pre-created event is best-effort deleted.
- **Invalid timezone / unsendable channel / bad template** → rejected at save time.
- **Bot down at fire time** → catches up on the next hourly run; the ledger keeps
  it at-most-once and never double.
- **Bot lacks Manage Events** → event creation skipped + logged; the message is
  still attempted independently.
- **Bot not in / removed from guild** → guild not cached → server skipped.

## Testing

Add a minimal **vitest** setup (no test runner exists today). Cover:
- Pure core: edit-window lock, MM-DD validation, Feb-29 fallback,
  "is birthday today in this tz", +7-day lead computation.
- Templating: Handlebars render, `strict`-mode rejection of unknown vars, length
  limits, and a **whitelist boundary** assertion that no `client`/token field can
  leak into the render context.
- Route-level zod validation for the two new endpoints.

## Out of scope (YAGNI)

- Per-user timezone (server timezone only).
- Configurable announce hour (fixed at local 09:00).
- Birthday year / age display.
- Roles or DMs on birthdays.
- Deleting a birthday (only set/change within the edit window).
