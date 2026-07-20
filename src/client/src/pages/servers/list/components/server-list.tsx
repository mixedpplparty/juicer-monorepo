import { AppBar } from "@mixedpplparty/juicer-m3/app-bar";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@mixedpplparty/juicer-m3/avatar";
import { Button } from "@mixedpplparty/juicer-m3/button";
import { Dialog } from "@mixedpplparty/juicer-m3/dialog";
import { AddIcon } from "@mixedpplparty/juicer-m3/icons/add";
import { List, ListItem } from "@mixedpplparty/juicer-m3/list";
import { Text } from "@mixedpplparty/juicer-m3/text";
import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import type { FilteredGuild } from "juicer-shared";
import { LogOutIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { logout } from "@/features/auth/api/mutations";
import { appBarStyles } from "@/shared/styles/app-bar";
import { hideOnDesktop } from "@/shared/styles/responsive";
import { useScrollState } from "../../hooks/use-scroll-state";
import { myInfoQueryOptions } from "../api/queries";
import { serverListStyles } from "./server-list.styles";

export function ServerList() {
	const { data: myData } = useSuspenseQuery(myInfoQueryOptions());
	const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
	const params = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const appBarScroll = useScrollState<HTMLElement>();
	const logoutMutation = useMutation({
		mutationFn: logout,
		onSuccess: () => {
			queryClient.removeQueries();
			navigate("/", { replace: true });
		},
	});

	return (
		<div css={serverListStyles.root}>
			<div css={serverListStyles.scrollArea}>
				<AppBar
					ref={appBarScroll.ref}
					title="서버 목록"
					container="transparent"
					data-scrolled={appBarScroll.isScrolled}
					css={[appBarStyles.root, hideOnDesktop]}
				/>
				<nav aria-label="서버 목록">
					<List container="transparent">
						{myData.guilds.map((guild: FilteredGuild) => {
							const selected = params.serverId === guild.id;

							return (
								<ListItem
									key={guild.id}
									headline={guild.name}
									leading={
										<Avatar>
											<AvatarImage src={guild.icon} alt="" />
											<AvatarFallback aria-hidden="true">
												{guild.name.substring(0, 2)}
											</AvatarFallback>
										</Avatar>
									}
									supportingText={`by ${guild.ownerName}`}
									render={
										<Link
											to={guild.id}
											aria-current={selected ? "page" : undefined}
										/>
									}
									selected={selected}
								/>
							);
						})}
						<ListItem
							leading={<AddIcon />}
							headline="juicer에 내 서버 추가하기"
							render={<a href={import.meta.env.VITE_BOT_INSTALL_URI} />}
						/>
					</List>
				</nav>
			</div>

			<footer css={serverListStyles.footer}>
				<Button
					type="button"
					variant="text"
					leadingIcon={<LogOutIcon aria-hidden="true" />}
					css={[
						serverListStyles.destructiveText,
						serverListStyles.footerButton,
					]}
					onClick={() => {
						logoutMutation.reset();
						setLogoutDialogOpen(true);
					}}
				>
					로그아웃
				</Button>
			</footer>

			<Dialog.Root
				open={logoutDialogOpen}
				onOpenChange={(open) => {
					if (!logoutMutation.isPending) {
						setLogoutDialogOpen(open);
						if (!open) {
							logoutMutation.reset();
						}
					}
				}}
			>
				<Dialog.Popup>
					<Dialog.Title>로그아웃할까요?</Dialog.Title>
					<Dialog.Description>
						현재 기기에서 Discord 계정 연결을 해제하고 로그인 화면으로
						돌아갑니다.
					</Dialog.Description>

					{logoutMutation.error && (
						<Text
							as="p"
							typeRole="body"
							size="medium"
							role="alert"
							css={serverListStyles.logoutError}
						>
							{logoutMutation.error.message}
						</Text>
					)}

					<Dialog.Actions>
						<Button
							type="button"
							variant="text"
							disabled={logoutMutation.isPending}
							onClick={() => {
								setLogoutDialogOpen(false);
								logoutMutation.reset();
							}}
						>
							취소
						</Button>
						<Button
							type="button"
							variant="text"
							disabled={logoutMutation.isPending}
							css={serverListStyles.destructiveText}
							onClick={() => logoutMutation.mutate()}
						>
							{logoutMutation.isPending ? "로그아웃 중…" : "로그아웃"}
						</Button>
					</Dialog.Actions>
				</Dialog.Popup>
			</Dialog.Root>
		</div>
	);
}

export default ServerList;
