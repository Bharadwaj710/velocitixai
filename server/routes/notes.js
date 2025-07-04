const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Note = require('../models/Note');


// Create a note
router.post("/", async (req, res) => {
  try {
    let { userId, courseId, lessonTitle, noteContent, transcriptIdx, timestamp } = req.body;
    // Convert userId and courseId to ObjectId if needed
    if (!userId || !courseId || !lessonTitle || !noteContent) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (typeof userId === "string" && userId.length === 24) userId = new mongoose.Types.ObjectId(userId);
    if (typeof courseId === "string" && courseId.length === 24) courseId = new mongoose.Types.ObjectId(courseId);

    const note = await Note.create({
      userId,
      courseId,
      lessonTitle,
      noteContent,
      transcriptIdx,
      timestamp,
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Note
router.put('/:noteId', async (req, res) => {
  try {
    const updatedNote = await Note.findByIdAndUpdate(req.params.noteId, req.body, { new: true });
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all notes for a user and course
router.get("/:userId/:courseId", async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    if (!userId || !courseId) return res.json([]);
    const notes = await Note.find({ userId, courseId });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a note
router.delete("/:id", async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
