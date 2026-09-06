import type { ReactNode } from "react";
import { useState } from "react";
import { createServer } from "@/features/server/api/mutations";
import type { Refetch } from "@/shared/api/refetch";
import { useLoading } from "@/shared/async/use-loading";
export interface ServerRegistrationPageProps {
	serverId: string;
	refetchServer: Refetch;
}

function useServerRegistrationPageModel({
	serverId,
	refetchServer,
}: ServerRegistrationPageProps) {
	const [registerServerPending, withRegisterServer] = useLoading();
	const [registerServerError, setRegisterServerError] = useState<Error | null>(
		null,
	);

	async function registerServer() {
		if (registerServerPending) return;
		setRegisterServerError(null);
		await withRegisterServer(async () => {
			try {
				await createServer(serverId);

				await refetchServer();
			} catch (error) {
				setRegisterServerError(
					error instanceof Error
						? error
						: new Error("요청을 처리하지 못했습니다."),
				);
			}
		});
	}
	return { registerServerPending, registerServerError, registerServer };
}
export type ServerRegistrationPageViewModel = ReturnType<
	typeof useServerRegistrationPageModel
>;
export function ServerRegistrationPagePresenter({
	children,
	...props
}: ServerRegistrationPageProps & {
	children: (model: ServerRegistrationPageViewModel) => ReactNode;
}) {
	const model = useServerRegistrationPageModel(props);
	return children(model);
}
