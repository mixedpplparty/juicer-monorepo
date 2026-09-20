import type { useSnackbar } from "@mixedpplparty/juicer-m3/snackbar";
import type { Refetch } from "@/shared/api/refetch";

/** A failed refresh must not turn a completed write into a failed submission. */
export async function refreshAfterSuccess(
	refetch: Refetch,
	enqueue: ReturnType<typeof useSnackbar>["enqueue"],
	successMessage: string,
) {
	try {
		await refetch();
	} catch {
		enqueue(`${successMessage} 목록을 새로고침하지 못했습니다.`, {
			title: "새로고침 필요",
			timeout: 0,
			actionLabel: "새로고침",
			onAction: () => {
				void refreshAfterSuccess(refetch, enqueue, successMessage);
			},
		});
		return;
	}

	enqueue(successMessage);
}
