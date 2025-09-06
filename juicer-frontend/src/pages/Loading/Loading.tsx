import { Card } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase"

export const Loading = () => {
	return <FullPageBase>
		<Card>
			<h1 css={{ margin: 0 }}>Loading...</h1>
		</Card>
	</FullPageBase>;
};