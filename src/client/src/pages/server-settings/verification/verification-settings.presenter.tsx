import { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import type { ReactNode } from "react";
import { useState } from "react";
import type { Refetch } from "@/shared/api/refetch";
import { useLoading } from "@/shared/async/use-loading";
import { showRequestError } from "@/shared/notifications/show-request-error";
import { updateServerVerificationRequired } from "./mutations";
export interface VerificationSettingsProps {
	serverId: string;
	refetchServer: Refetch;
	verificationRequired: boolean;
}

function useVerificationSettingsModel({
	serverId,
	refetchServer,
	verificationRequired,
}: VerificationSettingsProps) {
	const { enqueue } = useSnackbar();
	const [changeVerificationPending, withChangeVerification] = useLoading();
	const [requestedVerification, setRequestedVerification] = useState<
		boolean | null
	>(null);

	async function changeVerification(verificationRequired: boolean) {
		if (changeVerificationPending) return;
		setRequestedVerification(verificationRequired);
		await withChangeVerification(async () => {
			try {
				await updateServerVerificationRequired({
					serverId,
					verificationRequired,
				});

				await refetchServer();
				enqueue("서버 보안 설정을 변경했습니다.");
			} catch (error) {
				showRequestError(error, enqueue);
			}
		});
	}
	const checked =
		changeVerificationPending && requestedVerification !== null
			? requestedVerification
			: verificationRequired;
	return {
		changeVerificationPending,
		changeVerification,
		checked,
	};
}
export type VerificationSettingsViewModel = ReturnType<
	typeof useVerificationSettingsModel
>;
export function VerificationSettingsPresenter({
	children,
	...props
}: VerificationSettingsProps & {
	children: (model: VerificationSettingsViewModel) => ReactNode;
}) {
	const model = useVerificationSettingsModel(props);
	return children(model);
}
