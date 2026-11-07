import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
 name: "message",
 initialState: {
   messages: [],
   artifacts:[]
 },
 reducers: {
   setMessages: (state, action) => {
     state.messages = Array.isArray(action.payload) ? action.payload : [];
   },
   appendMessages: (state, action) => {
     const incoming = Array.isArray(action.payload) ? action.payload : [action.payload];
     state.messages = [...state.messages, ...incoming.filter(Boolean)];
   },
  setArtifacts: (state, action) => {
     state.artifacts = Array.isArray(action.payload) ? action.payload : [];
   }
 },
});

export const { setMessages, appendMessages, setArtifacts } = messageSlice.actions;
export default messageSlice.reducer;
