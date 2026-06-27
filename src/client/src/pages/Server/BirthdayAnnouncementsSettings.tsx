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
