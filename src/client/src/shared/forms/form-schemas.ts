import type {
	CreateGameRequestBody,
	NameRequiredRequestBody,
	UpdateGameRequestBody,
	UpdateRoleSettingsRequest,
} from "juicer-shared";
import { z } from "zod";

export const noTopicCategoryValue = "none";
export const unassignedRoleCategoryValue = "unassigned";

export const formValidationLimits = {
	topicName: 255,
	categoryName: 100,
	topicDescription: 2_000,
	roleDescription: 500,
	idList: 100,
} as const;

type TopicCreateSubmission = Required<
	Pick<CreateGameRequestBody, "name" | "description" | "categoryId">
>;

type TopicUpdateSubmission = Required<
	Pick<
		UpdateGameRequestBody,
		"name" | "description" | "categoryId" | "channels" | "roleIds"
	>
>;

type RoleSettingsSubmission = Required<
	Pick<
		UpdateRoleSettingsRequest,
		"roleCategoryId" | "selfAssignable" | "description"
	>
>;

function apiSchema<TOutput>() {
	return <TSchema extends z.ZodType<TOutput>>(schema: TSchema) => schema;
}

function requiredTrimmedName(
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

function nullableDescription(maxLength: number) {
	return z
		.string()
		.trim()
		.max(maxLength, `설명은 ${maxLength}자 이하여야 합니다.`)
		.transform((value) => value || null);
}

function nullablePositiveId(sentinel: string) {
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

function isDiscordSnowflake(value: string) {
	if (!/^\d{1,20}$/.test(value)) {
		return false;
	}
	const id = BigInt(value);
	return id > 0n && id <= 18_446_744_073_709_551_615n;
}

const discordIdList = (label: string) =>
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

const topicFieldsShape = {
	name: requiredTrimmedName(
		formValidationLimits.topicName,
		"주제명을 입력해주세요.",
		"주제명",
	),
	description: nullableDescription(formValidationLimits.topicDescription),
};

export const topicCreateFormSchema = apiSchema<TopicCreateSubmission>()(
	z.object({
		...topicFieldsShape,
		categoryId: z.union([z.null(), nullablePositiveId(noTopicCategoryValue)]),
	}),
);

export const topicUpdateFormSchema = apiSchema<TopicUpdateSubmission>()(
	z
		.object({
			...topicFieldsShape,
			categoryId: nullablePositiveId(noTopicCategoryValue),
			channelIds: discordIdList("채널"),
			roleIds: discordIdList("역할"),
		})
		.transform(({ channelIds, ...values }) => ({
			...values,
			channels: channelIds,
		})),
);

export const categoryNameFormSchema = apiSchema<NameRequiredRequestBody>()(
	z.object({
		name: requiredTrimmedName(
			formValidationLimits.categoryName,
			"이름을 입력해주세요.",
			"이름",
		),
	}),
);

export const roleSettingsFormSchema = apiSchema<RoleSettingsSubmission>()(
	z.object({
		roleCategoryId: nullablePositiveId(unassignedRoleCategoryValue),
		selfAssignable: z.boolean(),
		description: nullableDescription(formValidationLimits.roleDescription),
	}),
);

export type TopicCreateFormInput = z.input<typeof topicCreateFormSchema>;
export type TopicCreateFormOutput = z.output<typeof topicCreateFormSchema>;
export type TopicUpdateFormInput = z.input<typeof topicUpdateFormSchema>;
export type TopicUpdateFormOutput = z.output<typeof topicUpdateFormSchema>;
export type CategoryNameFormInput = z.input<typeof categoryNameFormSchema>;
export type CategoryNameFormOutput = z.output<typeof categoryNameFormSchema>;
export type RoleSettingsFormInput = z.input<typeof roleSettingsFormSchema>;
export type RoleSettingsFormOutput = z.output<typeof roleSettingsFormSchema>;
