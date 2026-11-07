import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Nav from "./Nav";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import getMessages from "../features/getMessages";
import { createConversation } from "../features/createConversation";
import { setMessages, setArtifacts } from "../redux/messageSlice";
import {
  addConversation,
  setSelectedConversation,
} from "../redux/conversationSlice";
import api from "../../utils/axios";

const ChatArea = ({ artifactPanelOpen, onOpenArtifacts }) => {
  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const { messages } = useSelector((state) => state.message);

  const dispatch = useDispatch();
  const extractArtifacts = (items) =>
    (Array.isArray(items) ? items : []).flatMap((message) =>
      Array.isArray(message?.artifacts) ? message.artifacts : []
    );

  useEffect(() => {
    let isMounted = true;

    const loadMessages = async () => {
      if (!selectedConversation?._id) {
        dispatch(setMessages([]));
        dispatch(setArtifacts([]));
        return;
      }

      try {
        const data = await getMessages(selectedConversation._id);

        if (isMounted) {
          const loadedMessages = Array.isArray(data) ? data : [];
          const loadedArtifacts = extractArtifacts(loadedMessages);
          dispatch(setMessages(loadedMessages));
          dispatch(setArtifacts(loadedArtifacts));
          if (loadedArtifacts.length > 0) {
            onOpenArtifacts?.();
          }
        }
      } catch (error) {
        console.error("Failed to load messages:", error);

        const fallback = (() => {
          try {
            const raw = localStorage.getItem("cortex-messages");
            const items = raw ? JSON.parse(raw) : {};

            return Array.isArray(
              items[selectedConversation._id]
            )
              ? items[selectedConversation._id]
              : [];
          } catch {
            return [];
          }
        })();

        if (isMounted) {
          dispatch(setMessages(fallback));
          dispatch(setArtifacts([]));
        }
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [dispatch, onOpenArtifacts, selectedConversation?._id]);

  const handleSendPrompt = async (
    prompt,
    conversation = selectedConversation,
    agentId = "chat",
    attachmentImages = []
  ) => {
    const trimmedPrompt = prompt?.trim?.() ?? "";

    if (!trimmedPrompt && !attachmentImages.length) {
      return;
    }

    // Selected agent → trim + lowercase
    const normalizedAgentId = String(agentId || "chat")
      .trim()
      .toLowerCase();

    console.log("Selected agent:", normalizedAgentId);

    let activeConversation = conversation;

    // Create conversation if there is no selected conversation
    if (!activeConversation) {
      const defaultTitle =
        trimmedPrompt.length > 32
          ? `${trimmedPrompt.slice(0, 32).trim()}...`
          : trimmedPrompt || "New image chat";

      try {
        const created = await createConversation(defaultTitle);

        const nextConversation =
          created && !Array.isArray(created)
            ? created
            : created &&
              Array.isArray(created) &&
              created.length > 0
            ? created[0]
            : {
                _id: `local-${Date.now()}`,
                title: defaultTitle,
              };

        if (nextConversation) {
          dispatch(addConversation(nextConversation));
          dispatch(setSelectedConversation(nextConversation));

          activeConversation = nextConversation;
        }
      } catch (error) {
        console.error(
          "Failed to create conversation before send:",
          error
        );
      }
    }

    // User message
    const userMessage = {
      _id: `user-${Date.now()}`,
      role: "user",
      content:
        trimmedPrompt ||
        (attachmentImages.length
          ? `Uploaded ${attachmentImages.length} image(s)`
          : ""),
      images: attachmentImages.map(
        (image) => image.dataUrl || image.url || image
      ),
    };

    const optimisticMessages = [
      ...messages,
      userMessage,
    ];

    dispatch(setMessages(optimisticMessages));

    // Save messages locally
    const persistLocalMessages = (items) => {
      if (!activeConversation?._id) return;

      try {
        const raw = localStorage.getItem("cortex-messages");
        const map = raw ? JSON.parse(raw) : {};

        map[activeConversation._id] = items;

        localStorage.setItem(
          "cortex-messages",
          JSON.stringify(map)
        );
      } catch {
        // Ignore localStorage errors
      }
    };

    persistLocalMessages(optimisticMessages);

    const safeHistory = Array.isArray(messages) ? messages.slice(-8) : [];

    try {
      const { data } = await api.post("/api/agent/chat", {
        prompt:
          trimmedPrompt ||
          "Describe the uploaded image(s)",

        conversationId: activeConversation?._id,

        // Send lowercase + trimmed agent
        agentId: normalizedAgentId,

        messages: safeHistory,

        images: attachmentImages.map(
          (image) =>
            image.dataUrl ||
            image.url ||
            image
        ),
      });

      const aiText =
        data?.message ||
        data?.response ||
        data?.aiResponse ||
        "I’m here to help.";

      const assistantImages = Array.isArray(data?.images)
        ? data.images
        : Array.isArray(data?.response?.images)
        ? data.response.images
        : Array.isArray(data?.message?.images)
        ? data.message.images
        : [];

      const responseArtifacts = Array.isArray(data?.artifacts)
        ? data.artifacts
        : [];
      dispatch(setArtifacts(responseArtifacts));
      if (responseArtifacts.length > 0) {
        onOpenArtifacts?.();
      }

      const assistantMessage = {
        _id: `assistant-${Date.now() + 1}`,
        role: "assistant",
        content: aiText,
        images: assistantImages,
        artifacts: Array.isArray(data?.artifacts) ? data.artifacts : [],
      };

      const finalMessages = [
        ...optimisticMessages,
        assistantMessage,
      ];

      dispatch(setMessages(finalMessages));

      persistLocalMessages(finalMessages);
      return data;
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message ||
        error?.message ||
        "The AI request failed.";

      const fallbackReply = {
        _id: `assistant-${Date.now() + 2}`,
        role: "assistant",
        content:
          "I’m ready to help. Add GROQ_API_KEY or GEMINI_API_KEY to enable live AI responses.",
      };

      const finalMessages = [
        ...optimisticMessages,
        {
          ...fallbackReply,
          content: `${fallbackReply.content}\n\n_Error: ${serverMessage}_`,
        },
      ];

      dispatch(setMessages(finalMessages));

      persistLocalMessages(finalMessages);

      console.error(
        "Agent request failed:",
        error
      );
    }
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-[#0b1020] text-white">
      <div className="flex flex-1 flex-col overflow-hidden">
        <Nav
          artifactPanelOpen={artifactPanelOpen}
          onOpenArtifacts={onOpenArtifacts}
        />

        <MessageList />

        <ChatInput onSend={handleSendPrompt} />
      </div>
    </main>
  );
};

export default ChatArea;