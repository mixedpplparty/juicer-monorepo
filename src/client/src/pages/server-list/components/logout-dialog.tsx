import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { logout } from "@/features/auth/api/mutations";
import { logoutDialogStyles } from "./logout-dialog.styles";

export function LogoutDialog() {
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: logout,
		onSuccess: () => {
			queryClient.removeQueries();
			navigate("/", { replace: true });
		},
	});

	const close = () => {
		setOpen(false);
		mutation.reset();
	};

	return (
		<>
			<footer css={logoutDialogStyles.footer}>
				<Button
					type="button"
					variant="text"
					leadingIcon={<LogOutIcon aria-hidden="true" />}
					css={[
						logoutDialogStyles.destructiveText,
						logoutDialogStyles.footerButton,
					]}
					onClick={() => {
						mutation.reset();
						setOpen(true);
					}}
				>
					로그아웃
				</Button>
			</footer>

			<Dialog.Root
				open={open}
				onOpenChange={(nextOpen) => {
					if (!mutation.isPending) {
						nextOpen ? setOpen(true) : close();
					}
				}}
			>
				<Dialog.Popup>
					<Dialog.Title>로그아웃할까요?</Dialog.Title>
					<Dialog.Description>
						현재 기기에서 Discord 계정 연결을 해제하고 로그인 화면으로
						돌아갑니다.
					</Dialog.Description>
					{mutation.error && (
						<Text
							as="p"
							typeRole="body"
							size="medium"
							role="alert"
							css={logoutDialogStyles.error}
						>
							{mutation.error.message}
						</Text>
					)}
					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={mutation.isPending}
							onClick={close}
						>
							취소
						</Button>
						<Button
							type="button"
							variant="text"
							disabled={mutation.isPending}
							css={logoutDialogStyles.destructiveText}
							onClick={() => mutation.mutate()}
						>
							{mutation.isPending ? "로그아웃 중…" : "로그아웃"}
						</Button>
					</Dialog.Actions>
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}

export default LogoutDialog;
