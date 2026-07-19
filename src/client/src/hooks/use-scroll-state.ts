import { useEffect, useState } from "react";

function findScrollContainer(element: HTMLElement): HTMLElement | Window {
	let parent = element.parentElement;

	while (parent) {
		const overflowY = window.getComputedStyle(parent).overflowY;
		if (
			(overflowY === "auto" || overflowY === "scroll") &&
			parent.scrollHeight > parent.clientHeight
		) {
			return parent;
		}
		parent = parent.parentElement;
	}

	return window;
}

function getScrollTop(target: HTMLElement | Window) {
	return target === window ? window.scrollY : (target as HTMLElement).scrollTop;
}

export function useScrollState<Element extends HTMLElement>() {
	const [element, setElement] = useState<Element | null>(null);
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		if (!element) {
			return;
		}

		let scrollContainer = findScrollContainer(element);
		const update = () => setIsScrolled(getScrollTop(scrollContainer) > 0);
		const bind = () => {
			scrollContainer.removeEventListener("scroll", update);
			scrollContainer = findScrollContainer(element);
			scrollContainer.addEventListener("scroll", update, { passive: true });
			update();
		};

		bind();
		window.addEventListener("resize", bind);

		return () => {
			scrollContainer.removeEventListener("scroll", update);
			window.removeEventListener("resize", bind);
		};
	}, [element]);

	return {
		ref: setElement,
		isScrolled,
	};
}
