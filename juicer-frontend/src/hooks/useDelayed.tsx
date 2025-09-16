import { useEffect, useRef } from "react";

export const useDelayed = (
	delay: number,
	fn: () => Promise<unknown>,
	state: unknown,
) => {
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const fnRef = useRef<() => Promise<unknown>>(fn);
	useEffect(() => {
		if (timeout.current) {
			clearTimeout(timeout.current);
		}
		timeout.current = setTimeout(() => fnRef.current(), delay);
		return () => {
			if (timeout.current) {
				clearTimeout(timeout.current);
			}
		};
	}, [state, delay]);
	return timeout.current;
};
