export async function getErrorMessage(response: Response, fallback: string) {
	const errorBody: unknown = await response.json().catch(() => null);
	return typeof errorBody === "object" &&
		errorBody !== null &&
		"message" in errorBody &&
		typeof errorBody.message === "string"
		? errorBody.message
		: fallback;
}
