import express from "express";
import {
  createConversations,
  deleteAllConversations,
  getConversations,
  getMessages,
  saveMessage,
  updateConversation,
} from "../controllers/chat.controllers.js";

const router = express.Router();

router.get("/create-conversation", createConversations);
router.post("/create-conversation", createConversations);
router.get("/get-conversation", getConversations);
router.get("/update-conversation", updateConversation);
router.patch("/update-conversation", updateConversation);
router.delete("/delete-all-conversations", deleteAllConversations);

router.post("/save-message", saveMessage);
router.get("/get-messages/:conversationId", getMessages);
router.post("/get-messages", getMessages);

export default router;