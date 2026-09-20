export class HttpError extends Error {
	readonly status: number;
	readonly statusText: string;

	constructor(response: Response, message: string) {
		super(message);
		this.name = "HttpError";
		this.status = response.status;
		this.statusText = response.statusText;
	}
}

let onHttpError: (error: HttpError) => void = () => {};

export function setHttpErrorHandler(handler: (error: HttpError) => void) {
	onHttpError = handler;
}

export function reportHttpError(error: HttpError) {
	onHttpError(error);
	return error;
}

export interface FetchJsonInit extends RequestInit {
	json?: unknown;
	/** Report errors for imperative GET commands as well as write requests. */
	reportError?: boolean;
}

async function getResponseErrorMessage(
	response: Response,
	fallbackMessage: string,
) {
	const body: unknown = await response.json().catch(() => null);

	return typeof body === "object" &&
		body !== null &&
		"message" in body &&
		typeof body.message === "string"
		? body.message
		: fallbackMessage;
}

export async function fetchJson<T>(
	input: RequestInfo | URL,
	init: FetchJsonInit = {},
	fallbackMessage = "요청을 처리하지 못했습니다.",
): Promise<T> {
	const { headers: initialHeaders, json, reportError, ...requestInit } = init;
	const headers = new Headers(initialHeaders);

	if (json !== undefined && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	const response = await fetch(input, {
		...requestInit,
		headers,
		body: json === undefined ? requestInit.body : JSON.stringify(json),
		credentials: init.credentials ?? "include",
	});

	if (!response.ok) {
		const error = new HttpError(
			response,
			await getResponseErrorMessage(response, fallbackMessage),
		);
		// Queries report errors after settling; plain write requests report them here.
		if (
			reportError ??
			(requestInit.method &&
				!["GET", "HEAD"].includes(requestInit.method.toUpperCase()))
		) {
			reportHttpError(error);
		}
		throw error;
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
