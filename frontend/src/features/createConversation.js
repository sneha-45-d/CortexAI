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

const writeLocalConversations = (items) => {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const createConversation = async (title = "New Chat") => {
 try {
   const payload = typeof title === "string" && title.trim() ? { title } : { title: "New Chat" };
   const { data } = await api.post("/api/chat/create-conversation", payload);
   return data;
 } catch (error) {
   console.error("Failed to create conversation:", error);
   try {
     const { data } = await api.get("/api/chat/create-conversation");
     return data;
   } catch (fallbackError) {
     const localValue = {
       _id: `local-${Date.now()}`,
       title: typeof title === "string" && title.trim() ? title : "New Chat",
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
     };

     const items = readLocalConversations();
     const nextItems = [localValue, ...items.filter((item) => item?._id !== localValue._id)];
     writeLocalConversations(nextItems);
     console.error("Fallback conversation creation failed:", fallbackError);
     return localValue;
   }
 }
};