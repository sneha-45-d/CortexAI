import axios from "axios";
import { addUserMemory } from "../../../shared/memory/memory.js";
import { chatAgent } from "../chat.agent.js";

export const agent = async (req, res) => {
 try {
   const { prompt, conversationId, agentId = "chat", images = [], messages = [] } = req.body ?? {};
   const userId = req.headers["x-user-id"] || req.user?.userId || req.user?.userID || "anonymous";
   const chatServiceUrl = process.env.CHAT_SERVICE_URL || "http://localhost:8002";

   if (!prompt || !String(prompt).trim()) {
     return res.status(400).json({ message: "Prompt is required" });
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

   const userImages = Array.isArray(images) ? images.filter(Boolean).map((image) => String(image)) : [];

   try {
     await axios.post(`${chatServiceUrl}/save-message`, {
       conversationId: currentConversationId,
       role: "user",
       content: String(prompt).trim(),
       images: userImages,
     });
   } catch (saveUserError) {
     console.warn("User message save failed, continuing without backend persistence:", saveUserError.message || saveUserError);
   }

   const result = await chatAgent({
     prompt: String(prompt).trim(),
     agentId,
     images: userImages,
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
       artifacts:result?.artifacts
     });
   } catch (saveAssistantError) {
     console.warn("Assistant message save failed, continuing without backend persistence:", saveAssistantError.message || saveAssistantError);
   }

   return res.status(200).json({
     message: aiResponse,
     response: aiResponse,
     conversationId: currentConversationId,
     agentId,
     assistantMessage: savedAssistantMessage?.data ?? null,
     images: assistantImages,
     artifacts: result?.artifacts || [],
   });
 } catch (error) {
   const message = error?.response?.data?.message || error?.message || "agent error";
   return res.status(500).json({ message: `agent error: ${message}` });
 }
};