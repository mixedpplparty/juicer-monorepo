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
