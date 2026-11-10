
import { useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Code2,
  FileText,
  LoaderCircle,
  Mic,
  Paperclip,
  Presentation,
  Search,
  X,
} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";
import { setArtifacts } from "../redux/messageSlice";

const AGENTS = [
  {
    id: "chat",
    label: "Chat",
    icon: Bot,
    accent: "from-indigo-500 to-violet-600",
  },
  {
    id: "coding",
    label: "Coding",
    icon: Code2,
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: "search",
    label: "Search",
    icon: Search,
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "pdf",
    label: "PDF",
    icon: FileText,
    accent: "from-amber-500 to-orange-600",
  },
  {
    id: "ppt",
    label: "PPT",
    icon: Presentation,
    accent: "from-pink-500 to-rose-600",
  },
];

const ChatInput = ({ onSend, isLoading = false }) => {
  const dispatch = useDispatch();

  const [value, setValue] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("chat");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const fileInputRef = useRef(null);

  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const selectedAgent =
    AGENTS.find((agent) => agent.id === selectedAgentId) ?? AGENTS[0];

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "pptx"].includes(extension)) {
      setFileError("Choose a PDF or PowerPoint (.pptx) file.");
      return;
    }

    if (file.size > 7 * 1024 * 1024) {
      setFileError("Files must be 7 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setFileError(`Failed to read ${file.name}.`);
        return;
      }

      setSelectedFile({ name: file.name, dataUrl: reader.result });
      setSelectedAgentId(extension === "pdf" ? "pdf" : "ppt");
      setFileError("");
    };
    reader.onerror = () => setFileError(`Failed to read ${file.name}.`);
    reader.readAsDataURL(file);
  };

  // ---------------------------------------
  // SUBMIT
  // ---------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedValue = value.trim();

    if (!trimmedValue && !selectedFile) return;

    try {
      // Send request to parent
      const result = await onSend(
        trimmedValue,
        selectedConversation,
        selectedAgentId,
        selectedFile
      );

      // ---------------------------------------
      // SET ARTIFACTS IN REDUX
      // ---------------------------------------

      if (result?.artifacts) {
        dispatch(setArtifacts(result.artifacts));
      } else {
        dispatch(setArtifacts([]));
      }

      // Clear input after successful request
      setValue("");
      setSelectedFile(null);
      setFileError("");
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );
    }
  };

  // ---------------------------------------
  // UI
  // ---------------------------------------

  return (
    <div className="border-t border-white/[0.06] bg-[#0d0f14] px-4 pb-4 pt-3">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">

        {/* AGENTS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {AGENTS.map(
            ({ id, label, icon: Icon, accent }) => {
              const isSelected =
                selectedAgentId === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setSelectedAgentId(id);
                  }}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    isSelected
                      ? "border-indigo-500/40 bg-indigo-500/10 text-white shadow-lg shadow-indigo-950/30"
                      : "border-white/10 bg-[#111827] text-slate-300 hover:border-white/15 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-white`}
                  >
                    <Icon size={12} />
                  </span>

                  {label}
                </button>
              );
            }
          )}
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 self-start rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {selectedFile.name.toLowerCase().endsWith(".pptx")
              ? <Presentation size={16} />
              : <FileText size={16} />}
            <span className="max-w-xs truncate">{selectedFile.name}</span>
            <button
              type="button"
              aria-label={`Remove ${selectedFile.name}`}
              onClick={() => setSelectedFile(null)}
              className="ml-1 rounded-full p-1 text-amber-100/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {fileError && (
          <p role="alert" className="text-sm text-red-300">{fileError}</p>
        )}

        {/* INPUT */}
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-3 rounded-2xl border border-indigo-500/20 bg-[#111827] p-2.5 shadow-inner shadow-indigo-950/30"
        >

          {/* BUTTONS */}
          <div className="flex items-center gap-2">

            {/* FILE INPUT */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* ATTACH */}
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Attach PDF or PowerPoint"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <Paperclip size={16} />
            </button>

            {/* MIC */}
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Voice input"
            >
              <Mic size={16} />
            </button>
          </div>

          {/* TEXTAREA */}
          <textarea
            value={value}
            onChange={(e) =>
              setValue(e.target.value)
            }
            maxLength={6000}
            rows={1}
            placeholder={
              selectedFile
                ? value.trim()
                  ? `Ask about ${selectedFile.name} or convert it...`
                  : `Send to convert ${selectedFile.name} to the other format...`
                : selectedAgentId === "chat"
                  ? "Ask anything..."
                  : `Ask ${selectedAgent.label.toLowerCase()} anything...`
            }
            className="max-h-32 min-h-[44px] flex-1 resize-none border-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />

          {/* SEND */}
          <button
            type="submit"
            disabled={
              isLoading ||
              !value.trim() &&
              !selectedFile
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            aria-label={`Send message with ${selectedAgent.label} agent`}
          >
            {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowUp size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;
