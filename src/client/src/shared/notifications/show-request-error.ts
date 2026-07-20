import type { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";

export function showRequestError(
	error: unknown,
	enqueue: ReturnType<typeof useSnackbar>["enqueue"],
) {
	enqueue(
		error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
		{ title: "오류" },
	);
}
