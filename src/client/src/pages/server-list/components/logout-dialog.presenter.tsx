import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { logout } from "@/features/auth/api/mutations";
import { useLoading } from "@/shared/async/use-loading";

export type LogoutDialogProps = Record<never, never>;
function useLogoutDialogModel() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [signOutPending, withSignOut] = useLoading();
	const [signOutError, setSignOutError] = useState<Error | null>(null);

	async function signOut() {
		if (signOutPending) return;
		setSignOutError(null);
		await withSignOut(async () => {
			try {
				await logout();

				queryClient.removeQueries();
				navigate("/", { replace: true });
			} catch (error) {
				setSignOutError(
					error instanceof Error
						? error
						: new Error("요청을 처리하지 못했습니다."),
				);
			}
		});
	}
	const close = () => {
		setOpen(false);
		setSignOutError(null);
	};
	return {
		open,
		setOpen,
		signOutPending,
		signOutError,
		setSignOutError,
		signOut,
		close,
	};
}
export type LogoutDialogViewModel = ReturnType<typeof useLogoutDialogModel>;
export function LogoutDialogPresenter({
	children,
}: LogoutDialogProps & {
	children: (model: LogoutDialogViewModel) => ReactNode;
}) {
	const model = useLogoutDialogModel();
	return children(model);
}
