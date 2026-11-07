import api from "../../utils/axios";

const STORAGE_KEY = "cortex-conversations";

const readLocalConversations = () => {
 try {
   const raw = localStorage.getItem(STORAGE_KEY);
   return raw ? JSON.parse(raw) : [];
 } catch {
   return [];
 }
};

export const getConversation = async () => {
 try {
   const { data } = await api.get("/api/chat/get-conversation");
   if (Array.isArray(data)) {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
     return data;
   }
   return readLocalConversations();
 } catch (error) {
   console.error("Failed to fetch conversations:", error);
   return readLocalConversations();
 }
};