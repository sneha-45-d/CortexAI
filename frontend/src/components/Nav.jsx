import { MessageSquare, PanelRightOpen } from "lucide-react";
import { useSelector } from "react-redux";

function Nav({ artifactPanelOpen, onOpenArtifacts }) {
  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const { messages } = useSelector(
    (state) => state.message
  );

  return (
    <div className="flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0d0f14] px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-500">
          <MessageSquare size={13} className="text-indigo-500" />
        </div>

        {selectedConversation?.title && (
          <div className="text-[14px] font-semibold tracking-tight text-white/90">
            {selectedConversation.title}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden" aria-hidden="true">
          {messages?.length || 0}
        </div>
        {!artifactPanelOpen && (
          <button
            type="button"
            onClick={onOpenArtifacts}
            aria-label="Open artifacts panel"
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 transition-colors duration-150 hover:bg-white/[0.05] hover:text-slate-200"
          >
            <PanelRightOpen size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Nav;