import React from "react";
import { motion } from "framer-motion";

const Message = ({ sender, text, timestamp, animate }) => {
  const isUser = sender === "user";
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString()
    : "";
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2 w-full`}
    >
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl shadow text-sm whitespace-pre-line break-words select-text transition-all duration-200 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        }`}
        title={formattedTime}
      >
        {text}
      </div>
    </motion.div>
  );
};

export default Message;
