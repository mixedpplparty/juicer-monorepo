import { z } from "zod";
export const formValidationLimits = {
	topicName: 255,
	categoryName: 100,
	topicDescription: 2_000,
	roleDescription: 500,
	idList: 100,
} as const;

export function apiSchema<TOutput>() {
	return <TSchema extends z.ZodType<TOutput>>(schema: TSchema) => schema;
}

export function requiredTrimmedName(
	maxLength: number,
	requiredMessage: string,
	label: string,
) {
	return z
		.string()
		.trim()
		.min(1, requiredMessage)
		.max(maxLength, `${label}은 ${maxLength}자 이하여야 합니다.`);
}

export function nullableDescription(maxLength: number) {
	return z
		.string()
		.trim()
		.max(maxLength, `설명은 ${maxLength}자 이하여야 합니다.`)
		.transform((value) => value || null);
}

export function nullablePositiveId(sentinel: string) {
	return z
		.string()
		.refine(
			(value) => {
				if (value === sentinel) {
					return true;
				}
				if (!/^[1-9]\d*$/.test(value)) {
					return false;
				}
				const id = Number(value);
				return Number.isSafeInteger(id) && id <= 2_147_483_647;
			},
			{ message: "유효한 카테고리를 선택해주세요." },
		)
		.transform((value) => (value === sentinel ? null : Number(value)));
}

export function isDiscordSnowflake(value: string) {
	if (!/^\d{1,20}$/.test(value)) {
		return false;
	}
	const id = BigInt(value);
	return id > 0n && id <= 18_446_744_073_709_551_615n;
}

export const discordIdList = (label: string) =>
	z
		.array(
			z.string().refine(isDiscordSnowflake, {
				message: `유효하지 않은 ${label} ID입니다.`,
			}),
		)
		.max(
			formValidationLimits.idList,
			`${label}은 최대 ${formValidationLimits.idList}개까지 선택할 수 있습니다.`,
		)
		.transform((ids) => [...new Set(ids)].toSorted());
