import { useCallback } from "react";
import axios from "axios";

const useChatBot = () => {
  // Returns a function to send a message to the backend
  return useCallback(async ({ userId, messages }) => {
    const res = await axios.post("/api/chat/message", {
      userId,
      messages,
    });
    return res.data;
  }, []);
};

export default useChatBot;
