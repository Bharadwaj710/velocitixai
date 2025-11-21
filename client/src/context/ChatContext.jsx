import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import useChatBot from "../hooks/useChatBot";
import { useAuth } from "./AuthContext";
import apiClient from "../api/apiClient";

const ChatContext = createContext();

export const ChatProvider = ({ children, courseId }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef(null);
  const sendMessageAPI = useChatBot();
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);

  const fetchSuggestions = async () => {
    try {
      const res = await apiClient.post("/api/chat/suggestions", {
        userId: user?._id || user?.id,
        courseId, // <- received from props to ChatProvider
      });
      const questions = Array.isArray(res.data.questions) ? res.data.questions : [];
      console.log("Fetched suggestions:", questions);
      if (questions.length) {
        setSuggestions(questions);
        setSuggestionsVisible(true);
      }
    } catch (err) {
      console.error("Suggestion error", err.message);
    }
  };

  // When chat is opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchSuggestions();
    }
  }, [isOpen]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = {
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setSuggestionsVisible(false); // ✅ hide suggestions on first message

    try {
      const res = await sendMessageAPI({
        userId: user?._id || user?.id,
        courseId,
        messages: [...messages, userMsg],
      });
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: res.reply, timestamp: new Date().toISOString() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I couldn't process your request.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };


  const clearChat = () => setMessages([]);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        toggleChat,
        messages,
        input,
        setInput,
        sendMessage,
        loading,
        chatWindowRef,
        setMessages,
        setLoading,
        clearChat,
        suggestions,
        suggestionsVisible,
        setSuggestionsVisible,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

export default ChatContext;
