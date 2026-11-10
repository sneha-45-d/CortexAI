import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

const inMemory = {
  conversations: new Map(), // userId -> [{ _id,title,userId,createdAt,updatedAt }]
  messages: new Map(), // conversationId -> [{ _id,conversationId,role,content,createdAt }]
};

const getUserId = (req) =>
  req.headers["x-user-id"] || req.user?.userId || req.user?.userID || req.user?.id || "anonymous";

const normalizeConversationTitle = (value) => {
  const trimmed = String(value || "New Chat").trim();
  if (!trimmed) return "New Chat";
  return trimmed.length > 40 ? `${trimmed.slice(0, 37).trim()}...` : trimmed;
};

const isDbConnected = () => mongoose?.connection?.readyState === 1;

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const createConversations = async (req, res) => {
  try {
    const userId = getUserId(req);
    const incomingTitle = req.body?.title || req.query?.title;
    const title = normalizeConversationTitle(incomingTitle || "New Chat");

    if (isDbConnected()) {
      const conversation = await Conversation.create({ userId, title });
      return res.status(200).json(conversation);
    }

    // Fallback: in-memory
    const id = makeId();
    const now = new Date();
    const conv = { _id: id, userId, title, createdAt: now, updatedAt: now };
    const list = inMemory.conversations.get(userId) || [];
    list.unshift(conv);
    inMemory.conversations.set(userId, list);
    return res.status(200).json(conv);
  } catch (error) {
    return res.status(500).json({ message: `create conversation error ${error.message || error}` });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (isDbConnected()) {
      const conversations = await Conversation.find({ userId }).sort({ updatedAt: -1 });
      return res.status(200).json(conversations);
    }

    const list = inMemory.conversations.get(userId) || [];
    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: `get conversations error ${error.message || error}` });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { id, title, conversationId } = req.body || {};
    const resolvedId = id || conversationId;

    if (!resolvedId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const newTitle = normalizeConversationTitle(title || "New Chat");

    if (isDbConnected()) {
      const conversation = await Conversation.findByIdAndUpdate(resolvedId, { title: newTitle }, { new: true });
      return res.status(200).json(conversation);
    }

    // in-memory update
    for (const [user, list] of inMemory.conversations.entries()) {
      const idx = list.findIndex((c) => String(c._id) === String(resolvedId));
      if (idx !== -1) {
        list[idx].title = newTitle;
        list[idx].updatedAt = new Date();
        return res.status(200).json(list[idx]);
      }
    }

    return res.status(404).json({ message: "conversation not found" });
  } catch (error) {
    return res.status(500).json({ message: `update conversation error ${error.message || error}` });
  }
};

export const saveMessage = async (req, res) => {
  try {
    const {
      conversationId,
      ConversationId,
      role,
      content,
      images = [],
      artifacts = [],
    } = req.body || {};
    const resolvedConversationId = conversationId || ConversationId;

    if (!resolvedConversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    const cleanContent = String(content ?? "").trim();
    if (!cleanContent && (!Array.isArray(images) || images.length === 0)) {
      return res.status(400).json({ message: "message content is required" });
    }

    const normalizedImages = Array.isArray(images) ? images.filter(Boolean).map((image) => String(image)) : [];
    const normalizedArtifacts = Array.isArray(artifacts) ? artifacts.filter((artifact) =>
      artifact && typeof artifact === "object" && typeof artifact.type === "string"
    ) : [];

    if (isDbConnected()) {
      const message = await Message.create({
        conversationId: resolvedConversationId,
        content: cleanContent || "",
        role,
        images: normalizedImages,
        artifacts: normalizedArtifacts,
      });

      if (role === "user") {
        const conversation = await Conversation.findById(resolvedConversationId);
        if (conversation) {
          const title = normalizeConversationTitle(conversation.title === "New Chat" ? cleanContent : conversation.title);
          await Conversation.findByIdAndUpdate(resolvedConversationId, { title, updatedAt: new Date() });
        }
      }

      return res.status(200).json(message);
    }

    // In-memory fallback
    const id = makeId();
    const now = new Date();
    const msg = {
      _id: id,
      conversationId: resolvedConversationId,
      content: cleanContent || "",
      role,
      images: normalizedImages,
      artifacts: normalizedArtifacts,
      createdAt: now,
    };
    const arr = inMemory.messages.get(resolvedConversationId) || [];
    arr.push(msg);
    inMemory.messages.set(resolvedConversationId, arr);

    if (role === "user") {
      for (const [user, list] of inMemory.conversations.entries()) {
        const conv = list.find((c) => String(c._id) === String(resolvedConversationId));
        if (conv) {
          conv.title = normalizeConversationTitle(conv.title === "New Chat" ? cleanContent : conv.title);
          conv.updatedAt = now;
        }
      }
    }

    return res.status(200).json(msg);
  } catch (error) {
    return res.status(500).json({ message: `save message error ${error.message || error}` });
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.conversationId || req.body?.conversationId || req.body?.ConversationId;

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId is required" });
    }

    if (isDbConnected()) {
      const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
      return res.status(200).json(messages);
    }

    const messages = inMemory.messages.get(conversationId) || [];
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: `get messages error ${error.message || error}` });
  }
};

export const deleteAllConversations = async (req, res) => {
  try {
    const userId = getUserId(req);

    const conversations = await Conversation.find({ userId });
    const conversationIds = conversations.map((conversation) => conversation._id);

    if (conversationIds.length > 0) {
      await Message.deleteMany({ conversationId: { $in: conversationIds } });
      await Conversation.deleteMany({ _id: { $in: conversationIds } });
    }

    return res.status(200).json({ success: true, deletedCount: conversationIds.length });
  } catch (error) {
    return res.status(500).json({ message: `delete all conversations error ${error}` });
  }
};
