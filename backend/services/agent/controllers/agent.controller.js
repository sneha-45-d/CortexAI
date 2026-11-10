import axios from "axios";
import { addUserMemory } from "../../../shared/memory/memory.js";
import { chatAgent } from "../chat.agent.js";
import { convertPptxToPdf, extractPdfText, pdfAgent } from "../pdf.agent.js";
import { extractPptxText, pptAgent } from "../ppt.agent.js";

const isPresentationTarget = (prompt) =>
  /\b(?:to|into|as)\s+(?:a\s+)?(?:pptx?|powerpoint|presentation|slides?)\b|\bpdf\s+to\s+(?:pptx?|powerpoint)\b|\b(?:create|make|generate|build|prepare)\b[\s\S]{0,80}\b(?:pptx?|powerpoint|presentation|slides?|deck)\b|\b(?:pptx?|powerpoint|presentation|slides?|deck)\b[\s\S]{0,80}\b(?:create|make|generate|build|prepare)\b/i.test(prompt);

const isPdfTarget = (prompt) =>
  /\b(?:to|into|as)\s+(?:a\s+)?pdf\b|\b(?:pptx?|powerpoint|presentation)\s+to\s+pdf\b|\b(?:create|make|generate|build|prepare)\b[\s\S]{0,80}\bpdf\b/i.test(prompt);

const isPdfFile = (file) => String(file?.name || "").toLowerCase().endsWith(".pdf");
const isPptxFile = (file) => String(file?.name || "").toLowerCase().endsWith(".pptx");

export const agent = async (req, res) => {
 try {
   const {
     prompt,
     conversationId,
     agentId = "chat",
     messages = [],
     attachment,
     pdf,
   } = req.body ?? {};
   const uploadedFile = attachment || pdf;
   const userId = req.headers["x-user-id"] || req.user?.userId || req.user?.userID || "anonymous";
   const normalizedAgentId = String(agentId).trim().toLowerCase();
   const chatServiceUrl = process.env.CHAT_SERVICE_URL || "http://localhost:8002";

   if (!prompt || !String(prompt).trim()) {
     return res.status(400).json({ message: "Prompt is required" });
   }
   if (normalizedAgentId === "image") {
     return res.status(410).json({ message: "The Image agent has been removed." });
   }
   const cleanPrompt = String(prompt).trim();
   let resolvedAgentId = normalizedAgentId;
   if (uploadedFile && isPdfFile(uploadedFile) && isPresentationTarget(cleanPrompt)) {
     resolvedAgentId = "ppt";
   } else if (uploadedFile && isPptxFile(uploadedFile) && isPdfTarget(cleanPrompt)) {
     resolvedAgentId = "pdf";
   } else if (["chat", "auto"].includes(normalizedAgentId) && isPresentationTarget(cleanPrompt)) {
     resolvedAgentId = "ppt";
   }

   let currentConversationId = conversationId;

   if (!currentConversationId) {
     const conversationResponse = await axios.get(`${chatServiceUrl}/create-conversation`, {
       headers: { "x-user-id": userId },
     });
     currentConversationId = conversationResponse?.data?._id;
   }

   const trimmedMessages = Array.isArray(messages) ? messages.slice(-8) : [];
   let previousMessages = trimmedMessages;
   if ((!previousMessages.length || !currentConversationId) && currentConversationId) {
     try {
       const historyResponse = await axios.get(`${chatServiceUrl}/get-messages/${currentConversationId}`);
       previousMessages = Array.isArray(historyResponse?.data) ? historyResponse.data.slice(-8) : [];
     } catch (historyError) {
       previousMessages = [];
     }
   }

   try {
     await axios.post(`${chatServiceUrl}/save-message`, {
       conversationId: currentConversationId,
       role: "user",
       content: uploadedFile?.name
         ? `${cleanPrompt}\nAttached file: ${String(uploadedFile.name).replace(/[\r\n]/g, "")}`
         : cleanPrompt,
     });
   } catch (saveUserError) {
     console.warn("User message save failed, continuing without backend persistence:", saveUserError.message || saveUserError);
   }

   const presentationSource = resolvedAgentId === "ppt" && uploadedFile
     ? isPdfFile(uploadedFile)
       ? await extractPdfText(uploadedFile)
       : isPptxFile(uploadedFile)
         ? await extractPptxText(uploadedFile).then((presentation) => ({
           fileName: presentation.fileName,
           text: presentation.slides
             .map((slide) => [slide.title, ...slide.content].join("\n"))
             .join("\n\n"),
         }))
         : null
     : null;

   const result = resolvedAgentId === "pdf"
     ? uploadedFile && isPptxFile(uploadedFile) && isPdfTarget(cleanPrompt)
       ? await convertPptxToPdf(uploadedFile)
       : await pdfAgent({
         prompt: cleanPrompt,
         messages: previousMessages,
         pdf: uploadedFile,
       })
     : resolvedAgentId === "ppt"
       ? await pptAgent({
         prompt: cleanPrompt,
         messages: previousMessages,
         sourceDocument: presentationSource,
       })
       : await chatAgent({
         prompt: cleanPrompt,
         agentId: resolvedAgentId,
         userId,
         messages: previousMessages,
       });

   const aiResponse = result?.aiResponse || "I’m here to help.";
   const assistantImages = Array.isArray(result?.images) ? result.images.filter(Boolean).map((image) => String(image)) : [];

   await addUserMemory(userId, `User preference or question: ${String(prompt).trim()}`);
   await addUserMemory(userId, `Assistant answer summary: ${String(aiResponse).slice(0, 800)}`);

   let savedAssistantMessage = null;
   try {
     savedAssistantMessage = await axios.post(`${chatServiceUrl}/save-message`, {
       conversationId: currentConversationId,
       role: "assistant",
       content: aiResponse,
       images: assistantImages,
       artifacts: result?.artifacts || [],
     });
   } catch (saveAssistantError) {
     console.warn("Assistant message save failed, continuing without backend persistence:", saveAssistantError.message || saveAssistantError);
   }

   return res.status(200).json({
     message: aiResponse,
     response: aiResponse,
     conversationId: currentConversationId,
     agentId: resolvedAgentId,
     assistantMessage: savedAssistantMessage?.data ?? null,
     images: assistantImages,
     artifacts: result?.artifacts || [],
   });
 } catch (error) {
   const message = error?.response?.data?.message || error?.message || "agent error";
   const errorStatus = Number(error?.status || error?.statusCode || error?.response?.status);
   const statusCode = errorStatus >= 400 && errorStatus <= 599 ? errorStatus : 500;
   return res.status(statusCode).json({ message: `agent error: ${message}` });
 }
};