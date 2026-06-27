import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { _fetchMyBirthday, _updateMyBirthday } from "../../remotes/remotes";
import { Button } from "../../ui/components/Button";
import { Card } from "../../ui/components/Card";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const BirthdayCard = () => {
	const queryClient = useQueryClient();
	const { showToast } = useToast();
	const _birthdayQuery = useQuery(_fetchMyBirthday.query());
	const birthday = _birthdayQuery.data;

	const [month, setMonth] = useState<number>(1);
	const [day, setDay] = useState<number>(1);
	const [saving, setSaving] = useState<boolean>(false);

	// Seed the selects from the loaded birthday once it arrives.
	useEffect(() => {
		if (birthday) {
			setMonth(birthday.month);
			setDay(birthday.day);
		}
	}, [birthday]);

	const locked = !!birthday && !birthday.editable;

	const save = async () => {
		setSaving(true);
		try {
			await _updateMyBirthday(month, day);
			await queryClient.invalidateQueries({ queryKey: ["myBirthday"] });
			showToast("생일을 저장했어요.", "success");
		} catch (e) {
			const message = isAxiosError(e)
				? (e.response?.data?.message ?? "생일을 저장하지 못했어요.")
				: "생일을 저장하지 못했어요.";
			showToast(message, "error");
		} finally {
			setSaving(false);
		}
	};

	return (
		<Card
			css={{
				border: "1px solid rgba(255, 255, 255, 0.66)",
				display: "flex",
				flexDirection: "column",
				gap: "12px",
			}}
		>
			<h2 css={{ margin: 0 }}>내 생일</h2>
			<div css={{ color: "rgba(255, 255, 255, 0.66)", fontSize: "0.875rem" }}>
				생일을 설정하면 봇이 있는 서버에서 축하 메시지와 일정이 자동으로
				만들어져요. 설정 후 한 달 동안만 변경할 수 있어요.
			</div>
			<div css={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
				<select
					value={month}
					disabled={locked || saving}
					onChange={(e) => setMonth(Number(e.target.value))}
					css={{ padding: "8px", borderRadius: "8px" }}
				>
					{MONTHS.map((m) => (
						<option key={m} value={m}>
							{m}월
						</option>
					))}
				</select>
				<select
					value={day}
					disabled={locked || saving}
					onChange={(e) => setDay(Number(e.target.value))}
					css={{ padding: "8px", borderRadius: "8px" }}
				>
					{DAYS.map((d) => (
						<option key={d} value={d}>
							{d}일
						</option>
					))}
				</select>
				<Button onClick={save} disabled={locked || saving}>
					저장
				</Button>
			</div>
			{locked && birthday && (
				<div css={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}>
					변경 가능 기간이 끝나 더 이상 수정할 수 없어요.
				</div>
			)}
			{!locked && birthday && (
				<div css={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.875rem" }}>
					{new Date(birthday.editableUntil).toLocaleDateString()}까지 변경할 수 있어요.
				</div>
			)}
		</Card>
	);
};
