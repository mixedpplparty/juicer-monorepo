import { useCallback, useEffect, useRef } from "react";
import { useBeforeUnload, useBlocker } from "react-router";

const defaultMessage =
	"저장하지 않은 변경사항이 있습니다. 페이지를 나가시겠습니까?";

export function useUnsavedChangesWarning(
	shouldBlock: boolean,
	message = defaultMessage,
) {
	const allowNavigationRef = useRef(false);
	const blocker = useBlocker(
		useCallback(
			() => shouldBlock && !allowNavigationRef.current,
			[shouldBlock],
		),
	);

	useBeforeUnload(
		useCallback(
			(event) => {
				if (shouldBlock && !allowNavigationRef.current) {
					event.preventDefault();
					event.returnValue = "";
				}
			},
			[shouldBlock],
		),
		{ capture: true },
	);

	useEffect(() => {
		if (blocker.state !== "blocked") {
			return;
		}

		if (window.confirm(message)) {
			blocker.proceed();
		} else {
			blocker.reset();
		}
	}, [blocker, message]);

	return useCallback(() => {
		allowNavigationRef.current = true;
	}, []);
}
