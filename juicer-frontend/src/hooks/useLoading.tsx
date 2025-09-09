import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// checks if mounted
export function useIsMountedRef() {
	const ref = useRef({ isMounted: true }).current;

	useEffect(() => {
		ref.isMounted = true;
		return () => {
			ref.isMounted = false;
		};
	}, [ref]);

	return ref;
}

export const useLoading = () => {
	const [isLoading, setIsLoading] = useState(false);
	const ref = useIsMountedRef();
	const startTransition = useCallback(
		async (promise: Promise<unknown>) => {
			try {
				setIsLoading(true);
				const data = await promise;
				return data;
			} finally {
				if (ref.isMounted) {
					setIsLoading(false);
				}
			}
		},
		[ref.isMounted],
	) as <T>(promise: Promise<T>) => Promise<T>;

	return useMemo(
		(): [boolean, <T>(promise: Promise<T>) => Promise<T>] => [
			isLoading,
			startTransition,
		],
		[isLoading, startTransition],
	);
};
