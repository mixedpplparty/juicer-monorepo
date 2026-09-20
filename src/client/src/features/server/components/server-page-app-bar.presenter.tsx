import type { ReactNode } from "react";
import { useScrollState } from "@/shared/browser/use-scroll-state";
export interface ServerPageAppBarProps {
	title: string;
	subtitle?: string;
	backTo: string;
	backLabel: string;
	actions?: ReactNode;
}

function useServerPageAppBarModel({
	title,
	subtitle,
	backTo,
	backLabel,
	actions,
}: ServerPageAppBarProps) {
	const scroll = useScrollState<HTMLElement>();
	return { title, subtitle, backTo, backLabel, actions, scroll };
}
export type ServerPageAppBarViewModel = ReturnType<
	typeof useServerPageAppBarModel
>;
export function ServerPageAppBarPresenter({
	children,
	...props
}: ServerPageAppBarProps & {
	children: (model: ServerPageAppBarViewModel) => ReactNode;
}) {
	const model = useServerPageAppBarModel(props);
	return children(model);
}
