import { css, Global } from "@emotion/react";
import styled from "@emotion/styled";
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

const globalStyles = css`
	:root {
		font-family:
			"Inter", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
			"Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
	}

	* {
		box-sizing: border-box;
	}

	html,
	body {
		min-height: 100%;
		margin: 0;
	}

	body {
		background: #ffffff;
		color: #111827;
	}

	@media (prefers-color-scheme: dark) {
		body {
			background: #030712;
			color: #f9fafb;
			color-scheme: dark;
		}
	}
`;

const ErrorMain = styled.main`
	width: min(100% - 2rem, 72rem);
	margin: 0 auto;
	padding: 4rem 1rem;
`;

const ErrorStack = styled.pre`
	width: 100%;
	padding: 1rem;
	overflow-x: auto;
`;

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				<Global styles={globalStyles} />
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<ErrorMain>
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<ErrorStack>
					<code>{stack}</code>
				</ErrorStack>
			)}
		</ErrorMain>
	);
}
