import { Suspense } from "react";
import { centeredPageStyles } from "@/shared/styles/layout";
import LandingContent from "./components/landing-content";

export function LandingPage() {
	return (
		<main css={centeredPageStyles}>
			<Suspense fallback={null}>
				<LandingContent />
			</Suspense>
		</main>
	);
}

export default LandingPage;
