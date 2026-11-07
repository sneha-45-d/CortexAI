
import { useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Code2,
  FileText,
  ImageIcon,
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
  {
    id: "image",
    label: "Image",
    icon: ImageIcon,
    accent: "from-violet-500 to-fuchsia-600",
  },
];

const ChatInput = ({ onSend }) => {
  const dispatch = useDispatch();

  const [value, setValue] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("chat");
  const [selectedImages, setSelectedImages] = useState([]);

  const fileInputRef = useRef(null);

  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const selectedAgent =
    AGENTS.find((agent) => agent.id === selectedAgentId) ?? AGENTS[0];

  // ---------------------------------------
  // IMAGE SELECT
  // ---------------------------------------

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (!imageFiles.length) return;

    Promise.all(
      imageFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              resolve({
                name: file.name,
                dataUrl: reader.result,
              });
            };

            reader.onerror = () => {
              reject(
                new Error(`Failed to read ${file.name}`)
              );
            };

            reader.readAsDataURL(file);
          })
      )
    )
      .then((results) => {
        setSelectedImages((current) => [
          ...current,
          ...results,
        ]);
      })
      .catch((error) => {
        console.error(
          "Failed to read selected images:",
          error
        );
      });

    // Allow selecting the same file again
    event.target.value = "";
  };

  // ---------------------------------------
  // REMOVE IMAGE
  // ---------------------------------------

  const removeImage = (imageName) => {
    setSelectedImages((current) =>
      current.filter((image) => image.name !== imageName)
    );
  };

  // ---------------------------------------
  // SUBMIT
  // ---------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedValue = value.trim();

    if (!trimmedValue && !selectedImages.length) {
      return;
    }

    try {
      // Send request to parent
      const result = await onSend(
        trimmedValue,
        selectedConversation,
        selectedAgentId,
        selectedImages
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
      setSelectedImages([]);
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
                  onClick={() =>
                    setSelectedAgentId(id)
                  }
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

        {/* SELECTED IMAGES */}
        {selectedImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedImages.map((image) => (
              <div
                key={image.name}
                className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-white/5"
              >
                <img
                  src={image.dataUrl}
                  alt={image.name}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  aria-label={`Remove ${image.name}`}
                  onClick={() =>
                    removeImage(image.name)
                  }
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
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
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* ATTACH */}
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
              aria-label="Attach image"
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
            rows={1}
            placeholder={
              selectedImages.length > 0
                ? selectedAgentId === "chat"
                  ? "Ask anything about this image..."
                  : `Ask ${selectedAgent.label.toLowerCase()} about this image...`
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
              !value.trim() &&
              !selectedImages.length
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            aria-label={`Send message with ${selectedAgent.label} agent`}
          >
            <ArrowUp size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInput;

