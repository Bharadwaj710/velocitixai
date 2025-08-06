const express = require('express');
const router = express.Router();
const Transcript = require('../models/TranscriptLive');

// POST /api/transcripts
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    const newTranscript = new Transcript({ content });
    await newTranscript.save();
    res.status(201).json({ message: 'Transcript saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save transcript' });
  }
});

module.exports = router;
