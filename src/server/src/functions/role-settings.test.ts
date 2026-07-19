import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UpdateRoleSettingsRequestBody } from "juicer-shared/dist/types/index.js";
import { buildRoleSettingsUpdate } from "./role-settings.js";

describe("UpdateRoleSettingsRequestBody", () => {
	it("accepts and normalizes a complete settings update", () => {
		const input = UpdateRoleSettingsRequestBody.parse({
			roleCategoryId: 12,
			selfAssignable: true,
			description: "  Community role  ",
		});

		assert.deepEqual(input, {
			roleCategoryId: 12,
			selfAssignable: true,
			description: "Community role",
		});
	});

	it("accepts a category-only move, including unassigning", () => {
		assert.deepEqual(
			UpdateRoleSettingsRequestBody.parse({ roleCategoryId: 3 }),
			{
				roleCategoryId: 3,
			},
		);
		assert.deepEqual(
			UpdateRoleSettingsRequestBody.parse({ roleCategoryId: null }),
			{ roleCategoryId: null },
		);
	});

	it("rejects empty, unknown, and ambiguous updates", () => {
		assert.equal(UpdateRoleSettingsRequestBody.safeParse({}).success, false);
		assert.equal(
			UpdateRoleSettingsRequestBody.safeParse({ selfAssignable: null }).success,
			false,
		);
		assert.equal(
			UpdateRoleSettingsRequestBody.safeParse({ unknownSetting: true }).success,
			false,
		);
	});
});

describe("buildRoleSettingsUpdate", () => {
	it("preserves omitted fields in partial updates", () => {
		assert.deepEqual(buildRoleSettingsUpdate({ roleCategoryId: 7 }), {
			roleCategoryId: 7,
		});
	});

	it("preserves explicit false and null values", () => {
		assert.deepEqual(
			buildRoleSettingsUpdate({
				roleCategoryId: null,
				selfAssignable: false,
				description: null,
			}),
			{
				roleCategoryId: null,
				selfAssignable: false,
				description: null,
			},
		);
	});
});
