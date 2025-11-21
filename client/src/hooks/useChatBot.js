import { useCallback } from "react";
import apiClient from "../api/apiClient";

const useChatBot = () => {
  // Returns a function to send a message to the backend
  return useCallback(async ({ userId, courseId, messages }) => {
    const res = await apiClient.post("/api/chat/message", {
      userId,
      courseId,
      messages,
    });
    return res.data;
  }, []);
};

export default useChatBot;
