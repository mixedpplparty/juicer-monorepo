import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { LogOutIcon } from "lucide-react";
import type { LogoutDialogViewModel } from "./logout-dialog.presenter";
import { logoutDialogStyles } from "./logout-dialog.styles";
export function LogoutDialogView({
	open,
	setOpen,
	signOutPending,
	signOutError,
	setSignOutError,
	signOut,
	close,
}: LogoutDialogViewModel) {
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
						setSignOutError(null);
						setOpen(true);
					}}
				>
					로그아웃
				</Button>
			</footer>

			<Dialog.Root
				open={open}
				onOpenChange={(nextOpen) => {
					if (!signOutPending) {
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
					{signOutError && (
						<Text
							as="p"
							typeRole="body"
							size="medium"
							role="alert"
							css={logoutDialogStyles.error}
						>
							{signOutError.message}
						</Text>
					)}
					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={signOutPending}
							onClick={close}
						>
							취소
						</Button>
						<Button
							type="button"
							variant="text"
							disabled={signOutPending}
							css={logoutDialogStyles.destructiveText}
							onClick={() => void signOut()}
						>
							{signOutPending ? "로그아웃 중…" : "로그아웃"}
						</Button>
					</Dialog.Actions>
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}
