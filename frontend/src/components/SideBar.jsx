import React, { useEffect, useState } from "react";
import {
  LogOut,
  MessageSquare,
  PanelLeftIcon,
  PenSquare,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import api from "../../utils/axios";
import { getConversation } from "../features/getConversation";
import { createConversation } from "../features/createConversation";
import {
  addConversation,
  setConversation,
  setSelectedConversation,
} from "../redux/conversationSlice";

function SideBar({ onGoogleLogin, onGoogleLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.user?.userData);
  const { conversations = [], selectedConversation } = useSelector(
    (state) => state.conversation
  );

  useEffect(() => {
    setAvatarError(false);
  }, [userData?.avatar, userData?.email]);

  useEffect(() => {
    const getConv = async () => {
      try {
        const data = await getConversation();
        if (Array.isArray(data)) {
          dispatch(setConversation(data));
          if (data.length === 0 && userData) {
            const created = await createConversation("New Chat");
            const nextConversation =
              created && !Array.isArray(created)
                ? created
                : created && Array.isArray(created) && created.length > 0
                  ? created[0]
                  : { _id: `local-${Date.now()}`, title: "New Chat" };

            if (nextConversation) {
              dispatch(addConversation(nextConversation));
              dispatch(setSelectedConversation(nextConversation));
            }
          }
        }
      } catch (error) {
        console.error("Failed to get conversations:", error);
      }
    };

    if (userData) {
      getConv();
    }
  }, [dispatch, userData]);

  const handleCreateConversation = async () => {
    try {
      const data = await createConversation();
      const nextConversation =
        data && !Array.isArray(data)
          ? data
          : data && Array.isArray(data) && data.length > 0
            ? data[0]
            : {
                _id: `local-${Date.now()}`,
                title: `New Chat ${conversations.length + 1}`,
              };

      if (nextConversation) {
        dispatch(addConversation(nextConversation));
        dispatch(setSelectedConversation(nextConversation));
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      const fallbackConversation = {
        _id: `local-${Date.now()}`,
        title: `New Chat ${conversations.length + 1}`,
      };
      dispatch(addConversation(fallbackConversation));
      dispatch(setSelectedConversation(fallbackConversation));
    }
  };

  const handleSelectConversation = (conversation) => {
    dispatch(setSelectedConversation(conversation));
  };

  const handleClearAllConversations = async () => {
    try {
      await api.delete("/api/chat/delete-all-conversations");
      dispatch(setConversation([]));
      dispatch(setSelectedConversation(null));

      const starter = { _id: `local-${Date.now()}`, title: "New Chat" };
      dispatch(addConversation(starter));
      dispatch(setSelectedConversation(starter));
    } catch (error) {
      console.error("Failed to clear conversations:", error);
    }
  };

  const userInitials = userData?.name
    ? userData.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "G";

  return (
    <aside
      className={`flex h-full shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0f14] transition-all duration-300 ${
        collapsed ? "w-[70px]" : "w-[270px]"
      }`}
    >
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-slate-300 transition-colors duration-150 hover:bg-white/[0.05] hover:text-white"
        >
          <PanelLeftIcon size={16} />
        </button>

        {!collapsed && (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-[16px] font-semibold tracking-tight text-white">
                CortexAI
              </span>
              <span className="rounded-full border border-indigo-600/30 bg-indigo-500/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-indigo-400">
                free
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCreateConversation}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-slate-300 transition-colors duration-150 hover:bg-white/[0.05] hover:text-white"
                aria-label="Create new chat"
              >
                <PenSquare size={15} />
              </button>
              <button
                onClick={handleClearAllConversations}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-slate-300 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-300"
                aria-label="Delete all chats"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 pt-4">
          <button
            onClick={handleCreateConversation}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-none bg-gradient-to-br from-indigo-500 to-violet-700 py-[10px] text-sm font-medium text-white transition-opacity duration-150 hover:opacity-90"
          >
            <MessageSquare size={17} />
            <span>New Chat</span>
          </button>
        </div>
      )}

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {conversations.length === 0 ? (
            <p className="px-2 py-3 text-center text-sm text-slate-500">
              No recent conversations
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const isSelected = selectedConversation?._id === conversation._id;

                return (
                  <button
                    key={conversation._id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-indigo-500/15 text-white"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                        isSelected
                          ? "bg-indigo-500 opacity-100"
                          : "bg-transparent opacity-0 group-hover:bg-slate-500 group-hover:opacity-100"
                      }`}
                    />
                    <span className="truncate">{conversation.title || "New Chat"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="relative border-t border-white/[0.06] p-3">
        {userData ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-2.5 text-left transition-colors hover:bg-white/[0.05]"
            >
              {!avatarError && userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt={userData.name || userData.email || "User"}
                  onError={() => setAvatarError(true)}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-200">
                  {userInitials}
                </div>
              )}

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {userData.name || userData.email || "Account"}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">
                    {userData.email || "Signed in"}
                  </p>
                </div>
              )}
            </button>

            {profileOpen && !collapsed && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20 rounded-xl border border-white/[0.08] bg-[#11151d] p-3 shadow-2xl shadow-black/30">
                <div className="mb-2 border-b border-white/[0.06] pb-2">
                  <p className="truncate text-sm font-semibold text-white">
                    {userData.name || "Account"}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {userData.email || "No email available"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onGoogleLogout?.();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06]"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onGoogleLogin?.()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06]"
          >
            <UserCircle2 size={16} />
            {!collapsed && <span>Login</span>}
          </button>
        )}
      </div>
    </aside>
  );
}

export default SideBar;
