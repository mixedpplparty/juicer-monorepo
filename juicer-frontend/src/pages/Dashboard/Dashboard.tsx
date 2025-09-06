import { Card } from "../../ui/components/Card";
import { FullPageBase } from "../../ui/components/FullPageBase";

export const Dashboard = () => {
	return (
		<FullPageBase>
			<Card>
				<h1 css={{ margin: 0 }}>juicer</h1>
				<div>
					It seems like it's your first time here. Would you like to register as
					admin or user?
				</div>
			</Card>
		</FullPageBase>
	);
};
