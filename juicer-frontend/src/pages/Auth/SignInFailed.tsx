import { Card } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const SignInFailed = () => {
	return (
		<FullPageBase>
			<Card>
				<h1 css={{ margin: 0 }}>Sign-in Failed</h1>
				<div>Please try again.</div>
			</Card>
		</FullPageBase>
	);
};
