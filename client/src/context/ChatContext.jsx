import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import useChatBot from "../hooks/useChatBot";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatWindowRef = useRef(null);
  const sendMessageAPI = useChatBot();

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
    try {
      const res = await sendMessageAPI({
        userId: user?._id || user?.id,
        messages: [...messages, userMsg],
      });
      console.log("Gemini chatbot response:", res);
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
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

export default ChatContext;
