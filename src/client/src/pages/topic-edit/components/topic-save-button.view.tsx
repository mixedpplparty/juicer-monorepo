import { Fab } from "@mixedpplparty/juicer-m3/fab";
import { CircularProgress } from "@mixedpplparty/juicer-m3/progress";
import { SaveIcon } from "lucide-react";
import { topicEditPageStyles } from "./topic-edit-content.styles";

interface TopicSaveButtonProps {
	pending: boolean;
	disabled: boolean;
}

export function TopicSaveButton({ pending, disabled }: TopicSaveButtonProps) {
	return (
		<Fab
			type="submit"
			aria-label={pending ? "주제 저장 중" : "주제 저장"}
			disabled={disabled}
			css={topicEditPageStyles.fab}
			icon={
				<span css={topicEditPageStyles.fabIcon}>
					{pending ? (
						<CircularProgress
							size={24}
							aria-label="저장 중"
							css={topicEditPageStyles.fabProgress}
						/>
					) : (
						<SaveIcon aria-hidden="true" />
					)}
				</span>
			}
		/>
	);
}

export default TopicSaveButton;
