import { useMemo, useSyncExternalStore } from "react";

export function useMediaQuery(query: string) {
	const mediaQuery = useMemo(() => window.matchMedia(query), [query]);

	return useSyncExternalStore(
		(onStoreChange) => {
			mediaQuery?.addEventListener("change", onStoreChange);
			return () => {
				mediaQuery?.removeEventListener("change", onStoreChange);
			};
		},
		() => mediaQuery?.matches ?? false,
	);
}
