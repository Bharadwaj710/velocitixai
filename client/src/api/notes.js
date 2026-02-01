// src/api/notes.js
import apiClient from "./apiClient";

// Defensive: Only fetch notes if both IDs are valid (24-char hex for MongoDB)
export const fetchNotes = (userId, courseId) => {
  if (
    !userId ||
    !courseId ||
    typeof userId !== "string" ||
    typeof courseId !== "string" ||
    userId.length !== 24 ||
    courseId.length !== 24
  ) {
    return Promise.resolve({ data: [] });
  }
  return apiClient
    .get(`/api/notes/${userId}/${courseId}`)
    .then((res) => ({ data: Array.isArray(res.data) ? res.data : [] }))
    .catch(() => ({ data: [] }));
};

export const saveNote = (note) => apiClient.post("/api/notes", note);
export const deleteNote = (noteId) => apiClient.delete(`/api/notes/${noteId}`);
export const updateNote = (noteId, updatedContent) =>
  apiClient.put(`/api/notes/${noteId}`, { noteContent: updatedContent });
