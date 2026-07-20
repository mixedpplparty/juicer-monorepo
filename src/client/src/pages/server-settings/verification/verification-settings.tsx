import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import { Switch } from "@mixedpplparty/juicer-m3/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serverQueryKeys } from "@/shared/api/query-keys/server-query-keys";
import { showRequestError } from "@/shared/notifications/show-request-error";
import SettingsSection from "../components/settings-section";
import { updateServerVerificationRequired } from "./mutations";
import { verificationSettingsStyles } from "./verification-settings.styles";

interface VerificationSettingsProps {
	serverId: string;
	verificationRequired: boolean;
}

export function VerificationSettings({
	serverId,
	verificationRequired,
}: VerificationSettingsProps) {
	const queryClient = useQueryClient();
	const { enqueue } = useSnackbar();
	const mutation = useMutation({
		mutationFn: updateServerVerificationRequired,
		onSuccess: async () => {
			await queryClient.refetchQueries({
				queryKey: serverQueryKeys.data(serverId),
			});
			enqueue("서버 보안 설정을 변경했습니다.");
		},
		onError: (error) => showRequestError(error, enqueue),
	});
	const checked =
		mutation.isPending && mutation.variables !== undefined
			? mutation.variables.verificationRequired
			: verificationRequired;

	return (
		<SettingsSection title="서버 보안">
			<List
				container="transparent"
				aria-label="서버 보안 설정"
				css={verificationSettingsStyles.list}
			>
				<ListItem
					css={verificationSettingsStyles.item}
					headline="특정 역할 보유자만 juicer 이용 가능"
					supportingText="켜면 아래 역할을 가진 멤버만 주제를 보고 역할을 받을 수 있습니다."
					trailing={
						<Switch
							checked={checked}
							disabled={mutation.isPending}
							aria-label="특정 역할 보유자만 juicer 이용 가능"
							onCheckedChange={(verificationRequired) =>
								mutation.mutate({ serverId, verificationRequired })
							}
						/>
					}
				/>
			</List>
		</SettingsSection>
	);
}

export default VerificationSettings;
