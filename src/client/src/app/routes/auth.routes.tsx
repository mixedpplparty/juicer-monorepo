import { Outlet, type RouteObject, redirect } from "react-router";
import { myInfoQueryOptions } from "@/features/auth/api/queries";
import LandingPage from "@/pages/landing/landing-page";
import { HttpError } from "@/shared/api/fetch-json";
import { queryClient } from "../query-client";

async function getCurrentUser() {
	try {
		return await queryClient.fetchQuery(myInfoQueryOptions());
	} catch (error) {
		if (error instanceof HttpError && error.status === 401) return null;
		throw error;
	}
}
async function guestOnlyLoader() {
	if (await getCurrentUser()) throw redirect("/servers");
	return null;
}
export async function authOnlyLoader() {
	if (!(await getCurrentUser())) throw redirect("/");
	return null;
}
export const guestRoutes: RouteObject = {
	loader: guestOnlyLoader,
	shouldRevalidate: () => false,
	Component: Outlet,
	children: [
		{ index: true, Component: LandingPage },
		{
			path: "sign-in-failed",
			lazy: async () => {
				const { default: Component } = await import(
					"@/pages/exceptions/sign-in-failed-page"
				);
				return { Component };
			},
		},
	],
};
