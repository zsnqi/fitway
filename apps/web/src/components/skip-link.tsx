import { useI18n } from "@/i18n/provider";

export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
	const { messages } = useI18n();

	return (
		<a
			className="public-skip-link"
			href={`#${targetId}`}
			onClick={(event) => {
				const target = document.getElementById(targetId);
				if (!target) return;
				event.preventDefault();
				target.focus({ preventScroll: true });
				target.scrollIntoView({ block: "start" });
			}}
		>
			{messages.common.skipToContent}
		</a>
	);
}
