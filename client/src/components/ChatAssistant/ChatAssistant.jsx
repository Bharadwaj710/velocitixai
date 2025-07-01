import React from "react";
import { Bot } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import Message from "./Message";
import ChatInput from "./ChatInput";
import axios from "axios";

const ChatAssistant = ({ courseId }) => {
  const {
    isOpen,
    toggleChat,
    messages,
    loading,
    chatWindowRef,
    clearChat,
    input,
    setInput,
    sendMessage,
  } = useChat();

  // Custom sendMessage to include courseId
  const sendMessageWithCourse = async (text) => {
    if (!text.trim()) return;
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const userId = user._id || user.id;
    const userMsg = {
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    // Add user message to messages array
    // ...existing code to update messages state...
    setInput("");
    try {
      const res = await axios.post("/api/chat/message", {
        userId,
        courseId, // Pass courseId to backend
        messages: [...messages, userMsg],
      });
      // ...existing code to update messages state with bot reply...
    } catch (err) {
      // ...existing error handling...
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center hover:bg-blue-700 transition-all duration-200"
        onClick={toggleChat}
        aria-label="Open AI Chatbot"
      >
        <Bot className="w-7 h-7" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-full max-w-xs sm:max-w-sm md:max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-gray-200"
          style={{ maxHeight: "75vh" }}
        >
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2">
            <span className="font-semibold">AI Chat Assistant</span>
            <button onClick={toggleChat} className="text-white text-lg">
              ×
            </button>
          </div>
          <div
            ref={chatWindowRef}
            className="flex-1 px-3 py-2 overflow-y-auto scroll-smooth bg-gray-50"
            style={{ maxHeight: "calc(75vh - 48px - 48px)" }}
          >
            {messages.length === 0 ? (
              <div className="text-gray-400 text-center mt-10">
                How can I help you today?
              </div>
            ) : (
              messages.map((msg, idx) => (
                <Message
                  key={idx}
                  {...msg}
                  animate={
                    msg.sender === "bot" &&
                    idx === messages.length - 1 &&
                    loading === false
                  }
                />
              ))
            )}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 animate-pulse">
                <Bot className="w-4 h-4" /> Typing...
              </div>
            )}
          </div>
          <ChatInput sendMessage={sendMessageWithCourse} />
          <button
            className="text-xs text-gray-400 hover:text-blue-600 py-1"
            onClick={clearChat}
          >
            Clear Chat
          </button>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
