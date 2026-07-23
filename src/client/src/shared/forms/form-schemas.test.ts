import { describe, expect, it } from "vitest";
import {
	categoryNameFormSchema,
	formValidationLimits,
	noTopicCategoryValue,
	roleSettingsFormSchema,
	topicCreateFormSchema,
	topicUpdateFormSchema,
	unassignedRoleCategoryValue,
} from "./form-schemas";

describe("topicCreateFormSchema", () => {
	it("trims values and converts empty optional fields", () => {
		expect(
			topicCreateFormSchema.parse({
				name: "  Valorant  ",
				description: "   ",
				categoryId: noTopicCategoryValue,
			}),
		).toEqual({
			name: "Valorant",
			description: null,
			categoryId: null,
		});
	});

	it("rejects blank and overlong names", () => {
		expect(
			topicCreateFormSchema.safeParse({
				name: "   ",
				description: "",
				categoryId: noTopicCategoryValue,
			}).success,
		).toBe(false);
		expect(
			topicCreateFormSchema.safeParse({
				name: "a".repeat(formValidationLimits.topicName),
				description: "",
				categoryId: noTopicCategoryValue,
			}).success,
		).toBe(true);
		expect(
			topicCreateFormSchema.safeParse({
				name: "a".repeat(formValidationLimits.topicName + 1),
				description: "",
				categoryId: noTopicCategoryValue,
			}).success,
		).toBe(false);
	});

	it("validates and converts category IDs", () => {
		expect(
			topicCreateFormSchema.parse({
				name: "Topic",
				description: " description ",
				categoryId: "42",
			}),
		).toMatchObject({ description: "description", categoryId: 42 });

		for (const categoryId of ["0", "-1", "1.5", "abc", "2147483648"]) {
			expect(
				topicCreateFormSchema.safeParse({
					name: "Topic",
					description: "",
					categoryId,
				}).success,
			).toBe(false);
		}
	});

	it("enforces the description limit after trimming", () => {
		expect(
			topicCreateFormSchema.safeParse({
				name: "Topic",
				description: "a".repeat(formValidationLimits.topicDescription + 1),
				categoryId: noTopicCategoryValue,
			}).success,
		).toBe(false);
	});
});

describe("topicUpdateFormSchema", () => {
	const baseValues = {
		name: "Topic",
		description: "",
		categoryId: noTopicCategoryValue,
		channelIds: [] as string[],
		roleIds: [] as string[],
	};

	it("renames channels and normalizes duplicate IDs", () => {
		expect(
			topicUpdateFormSchema.parse({
				...baseValues,
				channelIds: ["2", "1", "2"],
				roleIds: ["3", "3"],
			}),
		).toMatchObject({
			channels: ["1", "2"],
			roleIds: ["3"],
		});
	});

	it("rejects invalid snowflakes and too many IDs", () => {
		for (const channelId of [
			"0",
			"abc",
			"18446744073709551616",
			"123456789012345678901",
		]) {
			expect(
				topicUpdateFormSchema.safeParse({
					...baseValues,
					channelIds: [channelId],
				}).success,
			).toBe(false);
		}
		expect(
			topicUpdateFormSchema.safeParse({
				...baseValues,
				channelIds: Array.from(
					{ length: formValidationLimits.idList + 1 },
					(_, index) => String(index + 1),
				),
			}).success,
		).toBe(false);
	});
});

describe("categoryNameFormSchema", () => {
	it("trims names and applies the category length limit", () => {
		expect(categoryNameFormSchema.parse({ name: "  Games  " })).toEqual({
			name: "Games",
		});
		expect(
			categoryNameFormSchema.safeParse({
				name: "a".repeat(formValidationLimits.categoryName + 1),
			}).success,
		).toBe(false);
	});
});

describe("roleSettingsFormSchema", () => {
	it("normalizes nullable fields and validates description length", () => {
		expect(
			roleSettingsFormSchema.parse({
				roleCategoryId: unassignedRoleCategoryValue,
				selfAssignable: true,
				description: "   ",
			}),
		).toEqual({
			roleCategoryId: null,
			selfAssignable: true,
			description: null,
		});
		expect(
			roleSettingsFormSchema.safeParse({
				roleCategoryId: unassignedRoleCategoryValue,
				selfAssignable: false,
				description: "a".repeat(formValidationLimits.roleDescription + 1),
			}).success,
		).toBe(false);
	});
});
