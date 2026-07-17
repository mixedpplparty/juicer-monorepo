import styled from "@emotion/styled";
import { isRouteErrorResponse, useRouteError } from "react-router";

const Root = styled.main`
	display: grid;
	min-height: 100vh;
	padding: 24px;
	place-content: center;
	text-align: center;
`;

const Content = styled.div`
	display: flex;
	max-width: 480px;
	flex-direction: column;
	align-items: center;
	gap: 12px;
`;

const Title = styled.h1`
	margin: 0;
`;

const Message = styled.p`
	margin: 0;
`;

const RetryButton = styled.button`
	margin-top: 8px;
`;

function getErrorMessage(error: unknown) {
	if (isRouteErrorResponse(error)) {
		if (
			typeof error.data === "object" &&
			error.data !== null &&
			"message" in error.data &&
			typeof error.data.message === "string"
		) {
			return error.data.message;
		}

		if (typeof error.data === "string") {
			return error.data;
		}

		return error.statusText || `Request failed with status ${error.status}.`;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "An unexpected error occurred.";
}

export function RouteErrorBoundary() {
	const error = useRouteError();
	const title = isRouteErrorResponse(error)
		? `${error.status} ${error.statusText}`.trim()
		: "Something went wrong";

	return (
		<Root>
			<Content role="alert">
				<Title>{title}</Title>
				<Message>{getErrorMessage(error)}</Message>
				<RetryButton type="button" onClick={() => window.location.reload()}>
					Try again
				</RetryButton>
			</Content>
		</Root>
	);
}

export default RouteErrorBoundary;
