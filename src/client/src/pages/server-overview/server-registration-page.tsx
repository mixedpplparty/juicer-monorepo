import {
	ServerRegistrationPagePresenter,
	type ServerRegistrationPageProps,
} from "./server-registration-page.presenter";
import { ServerRegistrationPageView } from "./server-registration-page.view";

export type { ServerRegistrationPageProps } from "./server-registration-page.presenter";
export { ServerRegistrationUnavailablePage } from "./server-registration-page.view";

export function ServerRegistrationPage(props: ServerRegistrationPageProps) {
	return (
		<ServerRegistrationPagePresenter {...props}>
			{(model) => <ServerRegistrationPageView {...model} />}
		</ServerRegistrationPagePresenter>
	);
}
export default ServerRegistrationPage;
