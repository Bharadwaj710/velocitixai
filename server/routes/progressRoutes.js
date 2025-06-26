const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');

// POST /api/progress/complete
router.post('/complete', async (req, res) => {
  const { userId, courseId, lessonTitle } = req.body;

  if (!userId || !courseId || !lessonTitle) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      // Create new progress record
      progress = new Progress({
        userId,
        courseId,
        completedLessons: [lessonTitle]
      });
    } else {
      // Add lesson to completedLessons (if not already present)
      if (!progress.completedLessons.includes(lessonTitle)) {
        progress.completedLessons.push(lessonTitle);
      }
    }

    await progress.save();
    res.status(200).json({ message: 'Progress updated', progress });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/progress/:userId/:courseId
router.get('/:userId/:courseId', async (req, res) => {
  const { userId, courseId } = req.params;

  try {
    const progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(200).json({ completedLessons: [] });
    }

    res.status(200).json({ completedLessons: progress.completedLessons });
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
