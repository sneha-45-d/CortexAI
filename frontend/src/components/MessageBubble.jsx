
import { useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Download, FileText, Presentation } from "lucide-react";

function MessageBubble({
  role,
  content,
  images = [],
  artifacts = [],
}) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const normalizeText = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return String(value);
  };

  const safeContent = normalizeText(content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(safeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const downloadArtifact = (artifact) => {
    const bytes = Uint8Array.from(
      atob(String(artifact.content || "")),
      (character) => character.charCodeAt(0)
    );
    const isPptx = artifact.type === "pptx";
    const blob = new Blob([bytes], { type: artifact.mimeType || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = artifact.fileName || (isPptx ? "cortexai-presentation.pptx" : "cortexai-document.pdf");
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadImage = (image, index) => {
    const link = document.createElement("a");
    link.href = image;
    link.download = `cortexai-search-image-${index + 1}.${image.startsWith("data:image/jpeg") ? "jpg" : image.startsWith("data:image/webp") ? "webp" : "png"}`;
    link.click();
  };

  return (
    <>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div
          className={`relative max-w-[80%] rounded-2xl border px-4 py-3 text-[14px] leading-relaxed shadow-lg shadow-black/20 ${
            isUser
              ? "border-indigo-500/40 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-tr-md"
              : "border-white/10 bg-[#000000] text-white rounded-tl-md"
          }`}
        >
          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-1 text-[10px] font-medium text-indigo-200 transition hover:bg-indigo-500/20"
              aria-label="Copy response"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}

          {Array.isArray(images) && images.length > 0 && (
            <div className="mb-3 grid max-w-full gap-2 sm:grid-cols-2">
              {images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className="block w-full text-left"
                    aria-label={`Open image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`Message attachment ${index + 1}`}
                      className="max-h-[32rem] w-full object-contain transition duration-200 hover:scale-[1.01]"
                    />
                  </button>
                  {role === "assistant" && (
                    <div className="flex items-center justify-between border-t border-white/10 px-2 py-1.5">
                      <span className="text-[11px] text-slate-400">
                        Image result
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadImage(image, index)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-indigo-200 hover:bg-white/10"
                        aria-label={`Download image ${index + 1}`}
                      >
                        <Download size={12} />
                        Download
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={isUser ? "pr-0" : "pr-10 pt-1"}>
            {isUser ? (
              <div className="whitespace-pre-wrap break-words text-white">{safeContent}</div>
            ) : (
              <div className="cortex-markdown">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="mb-3 text-lg font-semibold text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-semibold text-white">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 last:mb-0 text-white">{children}</p>,
                    ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 text-white">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-white">{children}</ol>,
                    li: ({ children }) => <li className="pl-1 text-white">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-3 border-l-2 border-indigo-400/70 pl-3 text-indigo-100">
                        {children}
                      </blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-medium text-indigo-300 underline decoration-indigo-400/60 underline-offset-2 hover:text-indigo-200"
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-[#111111]">
                        <table className="min-w-full border-collapse text-left text-xs text-white">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-white/5 text-white">{children}</thead>,
                    th: ({ children }) => <th className="border-b border-white/10 px-3 py-2 font-semibold text-white">{children}</th>,
                    td: ({ children }) => <td className="border-b border-white/10 px-3 py-2 align-top text-white">{children}</td>,
                    code({ inline, className, children, ...props }) {
                      const language = /language-(\w+)/.exec(className || "")?.[1];
                      return !inline && language ? (
                        <SyntaxHighlighter
                          {...props}
                          style={oneDark}
                          language={language}
                          PreTag="div"
                          className="my-3 rounded-lg !bg-[#090d1a] text-xs"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[0.9em] text-indigo-200" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {safeContent}
                </Markdown>
              </div>
            )}
          </div>
          {!isUser && artifacts.filter((artifact) => ["pdf", "pptx"].includes(artifact?.type)).map((artifact) => (
            <button
              key={artifact.fileName || artifact.title}
              type="button"
              onClick={() => downloadArtifact(artifact)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs font-medium text-indigo-100 transition hover:bg-indigo-500/20"
            >
              {artifact.type === "pptx" ? <Presentation size={14} /> : <FileText size={14} />}
              <span>{artifact.fileName || (artifact.type === "pptx" ? "Generated PowerPoint" : "Generated PDF")}</span>
              <Download size={14} />
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] max-w-[90vw] rounded-2xl border border-white/10 bg-[#111111] p-2 shadow-2xl shadow-black/60">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#1a1a1a] text-xl font-semibold text-white shadow-lg transition hover:bg-[#2a2a2a]"
              aria-label="Close image"
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Expanded attachment"
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );

}

export default MessageBubble;
