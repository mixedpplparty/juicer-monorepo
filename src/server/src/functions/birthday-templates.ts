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
