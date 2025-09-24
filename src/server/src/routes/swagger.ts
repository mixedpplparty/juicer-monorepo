import { Hono } from "hono";

const app = new Hono();

const openApiDoc = {
	openapi: "0.0.1",
	info: {
		title: "juicer",
		version: "0.0.1",
		description: "juicer API",
	},
	paths: {},
};
app.get("/", (c) => {
	return c.json(openApiDoc);
});

export default app;
