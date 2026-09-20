import { useCallback, useEffect, useRef, useState } from "react";

/** Tracks async work without updating state after the component unmounts. */
export function useLoading(): [
	boolean,
	<T>(action: () => Promise<T>) => Promise<T>,
] {
	const [isLoading, setIsLoading] = useState(false);
	const mounted = useRef(true);
	const activeCount = useRef(0);
	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);
	const withLoading = useCallback(async <T>(action: () => Promise<T>) => {
		activeCount.current += 1;
		if (mounted.current) setIsLoading(true);
		try {
			return await action();
		} finally {
			activeCount.current -= 1;
			if (mounted.current) setIsLoading(activeCount.current > 0);
		}
	}, []);
	return [isLoading, withLoading];
}
