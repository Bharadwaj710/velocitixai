import React from "react";
import { motion } from "framer-motion";
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
    setMessages,
    setLoading,
    sendMessage,
    suggestions,
    suggestionsVisible,
    setSuggestionsVisible,
  } = useChat();

  // Custom sendMessage to include courseId and hide suggestions
  const sendMessageWithCourse = async (text) => {
    if (!text.trim()) return;

    const user = JSON.parse(localStorage.getItem("user")) || {};
    const userId = user._id || user.id;
    const userMsg = {
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    // Push user message first
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/chat/message", {
        userId,
        courseId,
        messages: [...messages, userMsg],
      });

      const reply = res.data.reply || "Sorry, I couldn’t process that.";

      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: reply, timestamp: new Date().toISOString() },
      ]);

      // Hide suggestions
      setSuggestionsVisible(false);
    } catch (err) {
      console.error("Chat error:", err.message);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
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
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 text-white px-4 py-2">
            <span className="font-semibold">AI Chat Assistant</span>
            <button onClick={toggleChat} className="text-white text-lg">
              ×
            </button>
          </div>

          {/* Body */}
          <div
            ref={chatWindowRef}
            className="flex-1 px-3 py-2 overflow-y-auto scroll-smooth bg-gray-50"
            style={{ maxHeight: "calc(75vh - 48px - 48px)" }}
          >
            {messages.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                <div className="mb-3">
                  Here are some course-related questions you can ask:
                </div>
                <div className="flex flex-col gap-2 items-start">
                  {suggestionsVisible && suggestions.length > 0 ? (
                    suggestions.map((rawQuestion, idx) => {
                      const question = rawQuestion
                        .replace(/^\s*[\*\-]?\s*\d*\.?\s*/, "")
                        .trim();

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1, duration: 0.3 }}
                          className="w-full"
                        >
                          <button
                            onClick={() => sendMessageWithCourse(question)}
                            className="bg-gray-100 text-gray-900 px-4 py-2 rounded-3xl text-sm text-left w-full hover:bg-gray-200 transition whitespace-normal"
                          >
                            • {question}
                          </button>
                        </motion.div>
                      );
                    })
                  ) : (
                    <span className="text-gray-400 italic">
                      Loading suggestions...
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <Message
                    key={idx}
                    {...msg}
                    animate={
                      msg.sender === "bot" &&
                      idx === messages.length - 1 &&
                      loading === false
                    }
                  />
                ))}
              </>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 animate-pulse">
                <Bot className="w-4 h-4" /> Typing...
              </div>
            )}
          </div>

          {/* Input */}
          <ChatInput sendMessage={sendMessageWithCourse} />

          {/* Clear Chat */}
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
