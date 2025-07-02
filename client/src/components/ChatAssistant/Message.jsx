import React from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Message = ({ sender, text, timestamp, animate }) => {
  const isUser = sender === "user";
  const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : "";

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2 w-full`}
    >
      <div
        className={`max-w-[70%] px-3 py-2 rounded-2xl shadow text-sm break-words select-text transition-all duration-200 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        }`}
        title={formattedTime}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            ul: ({ children }) => (
              <ul className="list-disc pl-4 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-tight text-sm">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-800">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-700">{children}</em>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-700 text-white text-sm p-3 rounded border border-gray-300 mb-2 overflow-auto max-w-full">
                <code className="whitespace-pre font-mono">{children}</code>
              </pre>
            ),
            code: ({ children }) => (
              <code className="bg-gray-700 text-white px-1 text-sm font-mono">
                {children}
              </code>
            ),

            p: ({ children }) => (
              <p className="mb-1 leading-relaxed">{children}</p>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
};

export default Message;
