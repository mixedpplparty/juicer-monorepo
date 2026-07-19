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

export interface FetchJsonInit extends RequestInit {
	json?: unknown;
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
	const { headers: initialHeaders, json, ...requestInit } = init;
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
		throw new HttpError(
			response,
			await getResponseErrorMessage(response, fallbackMessage),
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
