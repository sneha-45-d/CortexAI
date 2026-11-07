import api from "../../utils/axios";

const STORAGE_KEY = "cortex-messages";

const readLocalMessages = (conversationId) => {
 try {
   const raw = localStorage.getItem(STORAGE_KEY);
   const items = raw ? JSON.parse(raw) : {};
   return Array.isArray(items[conversationId]) ? items[conversationId] : [];
 } catch {
   return [];
 }
};

const writeLocalMessages = (conversationId, messages) => {
 try {
   const raw = localStorage.getItem(STORAGE_KEY);
   const items = raw ? JSON.parse(raw) : {};
   items[conversationId] = Array.isArray(messages) ? messages : [];
   localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
 } catch {
   // ignore storage write errors
 }
};

const getMessages = async (id) => {
 try {
   const { data } = await api.get(`/api/chat/get-messages/${id}`);
   const normalized = Array.isArray(data) ? data : [];
   if (id) {
     writeLocalMessages(id, normalized);
   }
   return normalized;
 } catch (error) {
   console.error("Failed to fetch messages:", error);
   return readLocalMessages(id);
 }
};

export default getMessages;