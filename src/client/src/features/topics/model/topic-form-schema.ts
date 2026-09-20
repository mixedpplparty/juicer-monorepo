import type {
	CreateGameRequestBody,
	UpdateGameRequestBody,
} from "juicer-shared";
import { z } from "zod";
import {
	apiSchema,
	discordIdList,
	formValidationLimits,
	nullableDescription,
	nullablePositiveId,
	requiredTrimmedName,
} from "@/shared/forms/validation";
export const noTopicCategoryValue = "none";
type TopicCreateSubmission = Required<
	Pick<CreateGameRequestBody, "name" | "description" | "categoryId">
>;

type TopicUpdateSubmission = Required<
	Pick<
		UpdateGameRequestBody,
		"name" | "description" | "categoryId" | "channels" | "roleIds"
	>
>;

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

export type TopicCreateFormInput = z.input<typeof topicCreateFormSchema>;
export type TopicCreateFormOutput = z.output<typeof topicCreateFormSchema>;
export type TopicUpdateFormInput = z.input<typeof topicUpdateFormSchema>;
export type TopicUpdateFormOutput = z.output<typeof topicUpdateFormSchema>;
