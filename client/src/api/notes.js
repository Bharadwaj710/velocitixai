// src/api/notes.js
import axios from 'axios';

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
  return axios
    .get(`http://localhost:8080/api/notes/${userId}/${courseId}`)
    .then((res) => ({ data: Array.isArray(res.data) ? res.data : [] }))
    .catch(() => ({ data: [] }));
};

export const saveNote = (note) => axios.post('http://localhost:8080/api/notes', note);
export const deleteNote = (noteId) => axios.delete(`http://localhost:8080/api/notes/${noteId}`);
export const updateNote = (noteId, updatedContent) => axios.put(`http://localhost:8080/api/notes/${noteId}`, { noteContent: updatedContent });