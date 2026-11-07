import React from "react";
import { useSelector } from "react-redux";
import MessageBubble from "./MessageBubble";

const MessageList = () => {
  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const { messages } = useSelector(
    (state) => state.message
  );

  const suggestions = [
    "Write a Netflix Clone",
    "Explain Redis",
    "Build a dashboard",
  ];

  return (
    <>
      <div className="flex flex-1 overflow-y-auto bg-[#0b1020] px-6 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {!selectedConversation || messages?.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-[20px] font-semibold text-white/90 tracking-tight">
                CortexAI
              </h1>

              <p className="mt-2 text-[15px] font-semibold text-indigo-200 tracking-tight">
                Ask anything
              </p>

              <p className="mt-1 max-w-md text-[13px] font-medium text-slate-300 tracking-tight">
                Ask anything — code, ideas, explanations, or just a quick
                question.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-4xl">
            {messages?.map((msg, i) => (
              <MessageBubble
                key={msg._id || i}
                role={msg.role}
                content={msg.content}
                images={Array.isArray(msg.images) ? msg.images : []}
              />
            ))}
          </div>
        )}
      </div>

      {!selectedConversation && (
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="cursor-pointer rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[12px] text-indigo-100 transition-colors duration-150 hover:bg-indigo-500/20 hover:text-white"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default MessageList;