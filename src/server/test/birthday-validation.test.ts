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
