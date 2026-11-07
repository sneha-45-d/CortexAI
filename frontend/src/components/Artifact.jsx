import { useState } from "react";
import { useSelector } from "react-redux";
import { motion } from "motion/react";
import { Check, Code2, Copy, Eye, PanelRightClose, X } from "lucide-react";

function Artifact({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { artifacts = [] } = useSelector((state) => state.message);

  if (artifacts.length === 0) return null;

  const artifact = artifacts[0];
  const content = String(artifact.content || "");
  const language = String(artifact.language || "text").toLowerCase();
  const canRenderHtml = ["html", "htm"].includes(language);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy artifact:", error);
    }
  };

  return (
   <motion.div
     initial={{ opacity: 0, x: 12 }}
     animate={{ opacity: 1, x: 0 }}
     transition={{ duration: 0.2 }}
     className="hidden h-full w-[250px] shrink-0 flex-col overflow-hidden border-l border-white/[0.06] lg:flex"
   >
     <div className="flex h-full flex-col bg-[#0d0f14]">
       <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] px-4">
         <button
           type="button"
           aria-label="Close artifacts panel"
           onClick={onClose}
           className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-slate-500 transition-colors duration-150 hover:bg-white/[0.05] hover:text-slate-200"
         >
           <PanelRightClose size={16} />
         </button>
         <div className="flex min-w-0 flex-1 items-center gap-2">
           <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-indigo-500/20 bg-indigo-500/10">
             <Code2 className="text-indigo-400" size={12} />
           </div>
           <div className="truncate text-[13px] font-medium text-slate-200">
             {artifact.prompt || artifact.title}
           </div>
         </div>
       </div>
       <div className="flex flex-1 flex-col overflow-hidden">
       <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
         <span className="truncate text-[11px] text-slate-500">
           {artifact.fileName || language}
         </span>
         <div className="flex items-center gap-1">
           <button
             type="button"
             onClick={handleCopy}
             aria-label="Copy artifact code"
             className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
           >
             {copied ? <Check size={13} /> : <Copy size={13} />}
             {copied ? "Copied" : "Copy"}
           </button>
           <button
             type="button"
             onClick={() => setPreviewOpen(true)}
             aria-label="Preview artifact"
             className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
           >
             <Eye size={13} />
             Preview
           </button>
         </div>
       </div>
       <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-4 text-[11px] leading-relaxed text-slate-300">
         {content}
       </pre>
       </div>
     </div>
     {previewOpen && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
       <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#11141d] shadow-2xl">
         <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
           <span className="truncate text-sm font-medium text-slate-200">
             {artifact.fileName || "Artifact preview"}
           </span>
           <button
             type="button"
             onClick={() => setPreviewOpen(false)}
             aria-label="Close artifact preview"
             className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-white/[0.06] hover:text-white"
           >
             <X size={16} />
           </button>
         </div>
         {canRenderHtml ? (
           <iframe
             title="Artifact preview"
             srcDoc={content}
             sandbox="allow-scripts"
             className="h-full w-full bg-white"
           />
         ) : (
           <pre className="h-full overflow-auto whitespace-pre-wrap break-words p-5 text-sm leading-relaxed text-slate-200">
             {content}
           </pre>
         )}
       </div>
       </div>
     )}
   </motion.div>
  );
}

export default Artifact;