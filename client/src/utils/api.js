import apiClient from "../api/apiClient";
import { toast } from "react-toastify";

// Re-export centralized client for backward compatibility
export const handleSuccess = (msg) => {
  toast.success(msg, { position: "top-right" });
};

export const handleError = (msg) => {
  toast.error(msg, { position: "top-right" });
};

export default apiClient;
