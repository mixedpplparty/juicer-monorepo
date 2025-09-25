import { isAxiosError } from "axios";
import { HTTPException } from "hono/http-exception";

export const throwAxiosError = (error: unknown): never => {
	if (isAxiosError(error)) {
		if (error.response) {
			if (error.response.status === 401) {
				throw new HTTPException(401, {
					message: "Most likely not authenticated.",
				});
			} else if (error.response.status === 404) {
				throw new HTTPException(404, {
					message: "User not found.",
				});
			} else if (error.response.status === 403) {
				throw new HTTPException(403, {
					message: "User not authorized.",
				});
			} else if (error.response.status === 400) {
				throw new HTTPException(400, {
					message: "Bad request.",
				});
			} else if (error.response.status === 500) {
				console.error("500");
				console.error(error.response);
				throw new HTTPException(500, {
					message: "Internal server error.",
				});
			} else {
				console.error("Unhandled axios error");
				console.error(error.response);
				throw new HTTPException(500, {
					message: "Unhandled axios error.",
				});
			}
		} else if (error.request) {
			console.error("Error on request");
			console.error(error.request);
			throw new HTTPException(500, {
				message: "Error on request.",
			});
		} else {
			console.error("Unhandled axios error");
			console.error(error);
			throw new HTTPException(500, {
				message: "Unhandled axios error.",
			});
		}
	} else {
		console.error("Unknown error outside of axios");
		console.error(error);
		throw new HTTPException(500, {
			message: "Unknown error outside of axios.",
		});
	}
};
