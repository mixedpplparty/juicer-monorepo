import { useRef } from "react";

export const useIntersectionObserver = (
	callbackFnOnIntersect: () => void,
	callbackFnOnUnintersect: () => void,
) => {
	const observer = useRef<IntersectionObserver>(
		new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.intersectionRatio < 1) {
						callbackFnOnIntersect();
					} else {
						callbackFnOnUnintersect();
					}
				});
			},
			{ threshold: 1 },
		),
	);
	const observe = (element: HTMLElement) => {
		observer.current.observe(element);
	};
	const unobserve = (element: HTMLElement) => {
		observer.current.unobserve(element);
	};
	return [observe, unobserve];
};
