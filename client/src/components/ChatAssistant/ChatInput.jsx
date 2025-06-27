import React from "react";
import { ArrowUp } from "lucide-react";
import { useChat } from "../../context/ChatContext";

const ChatInput = () => {
  const { input, setInput, sendMessage, loading } = useChat();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center border-t px-2 py-2 bg-white"
    >
      <input
        type="text"
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring focus:ring-blue-200 text-sm"
        placeholder="Type your question..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading}
        autoFocus
      />
      <button
        type="submit"
        className="ml-2 bg-blue-600 text-white p-2 rounded-full shadow hover:bg-blue-700 transition text-sm flex items-center justify-center"
        disabled={loading || !input.trim()}
        aria-label="Send"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </form>
  );
};

export default ChatInput;
