import type { MyDataInServer } from "juicer-shared";
import type { ReactNode } from "react";
export interface MyServerProfileProps {
	myDataInServer: MyDataInServer;
}

function useMyServerProfileModel({ myDataInServer }: MyServerProfileProps) {
	return { myDataInServer };
}
export type MyServerProfileViewModel = ReturnType<
	typeof useMyServerProfileModel
>;
export function MyServerProfilePresenter({
	children,
	...props
}: MyServerProfileProps & {
	children: (model: MyServerProfileViewModel) => ReactNode;
}) {
	const model = useMyServerProfileModel(props);
	return children(model);
}
