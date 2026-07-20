import { Button } from "@mixedpplparty/juicer-m3/button";
import { Text } from "@mixedpplparty/juicer-m3/text";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createServer } from "./api/mutations";
import {
	myDataInServerQueryOptions,
	serverQueryOptions,
	topicsQueryOptions,
} from "./api/queries";
import { serverRegistrationPageStyles } from "./server-registration-page.styles";

export interface ServerRegistrationPageProps {
	serverId: string;
}

export function ServerRegistrationPage({
	serverId,
}: ServerRegistrationPageProps) {
	const queryClient = useQueryClient();
	const registrationMutation = useMutation({
		mutationFn: () => createServer(serverId),
		onSuccess: async () => {
			await Promise.all([
				queryClient.fetchQuery({
					...serverQueryOptions(serverId),
					staleTime: 0,
				}),
				queryClient.fetchQuery({
					...myDataInServerQueryOptions(serverId),
					staleTime: 0,
				}),
				queryClient.fetchQuery({
					...topicsQueryOptions(serverId, ""),
					staleTime: 0,
				}),
			]);
		},
	});

	return (
		<section
			css={serverRegistrationPageStyles.root}
			aria-labelledby="server-registration-title"
		>
			<div css={serverRegistrationPageStyles.copy}>
				<Text
					as="h1"
					id="server-registration-title"
					typeRole="headline"
					size="medium"
				>
					서버를 juicer에 등록해 주세요
				</Text>
				<Text
					as="p"
					typeRole="body"
					size="large"
					css={serverRegistrationPageStyles.description}
				>
					juicer 데이터베이스에 이 서버를 추가하면 주제와 역할을 관리할 수
					있어요.
				</Text>
			</div>

			<Button
				type="button"
				disabled={registrationMutation.isPending}
				onClick={() => registrationMutation.mutate()}
			>
				{registrationMutation.isPending
					? "서버 등록하는 중..."
					: "서버 등록하기"}
			</Button>

			{registrationMutation.isError && (
				<Text
					as="p"
					typeRole="body"
					size="medium"
					role="alert"
					css={serverRegistrationPageStyles.error}
				>
					{registrationMutation.error.message}
				</Text>
			)}
		</section>
	);
}

export default ServerRegistrationPage;
