import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
 name: "conversation",
 initialState: {
   conversations: [],
   selectedConversation: null,
 },
 reducers: {
   setConversation: (state, action) => {
     state.conversations = Array.isArray(action.payload) ? action.payload : [];
   },
   addConversation: (state, action) => {
     const incoming = action.payload;
     if (!incoming) return;

     const exists = state.conversations.some(
       (conversation) => conversation?._id === incoming?._id
     );

     if (!exists) {
       state.conversations = [incoming, ...state.conversations];
     }
   },
   setSelectedConversation: (state, action) => {
     state.selectedConversation = action.payload;
   },
   setConversationTitle: (state, action) => {
     const { conversationId, title } = action.payload;
     const conversation = state.conversations.find(
       (conv) => conv._id === conversationId
     );

     if (conversation) {
       conversation.title = title;
     }
   },
 },
});

export const { setConversation, addConversation, setSelectedConversation, setConversationTitle } =
 conversationSlice.actions;
export default conversationSlice.reducer;
