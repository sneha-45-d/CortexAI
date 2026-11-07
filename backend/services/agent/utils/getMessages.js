export const getMessages = async (conversationId) => {
    try {
        const { data } = await api.get(`/api/chat/get-messages/${conversationId}`);
        return data || [];
    } catch (error) {
        console.error("Error fetching messages:", error);
        return [];
    }