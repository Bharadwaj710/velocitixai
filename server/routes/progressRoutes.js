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
        completedLessons: [lessonTitle],
        updatedAt: new Date()
      });
    } else {
      // Add lesson to completedLessons (if not already present)
      if (!progress.completedLessons.includes(lessonTitle)) {
        progress.completedLessons.push(lessonTitle);
      }
      progress.updatedAt = new Date();
    }

    await progress.save();
    res.status(200).json({ message: 'Progress updated', progress });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/progress/uncomplete
router.post('/uncomplete', async (req, res) => {
  const { userId, courseId, lessonTitle } = req.body;

  if (!userId || !courseId || !lessonTitle) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(404).json({ message: 'Progress not found' });
    }

    // Remove lesson from completedLessons
    progress.completedLessons = progress.completedLessons.filter(l => l !== lessonTitle);
    progress.updatedAt = new Date();
    await progress.save();
    res.status(200).json({ message: 'Lesson unmarked as completed', progress });
  } catch (err) {
    console.error('Error updating progress:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/progress/:userId/:courseId
router.get('/:userId/:courseId', async (req, res) => {
  const { userId, courseId } = req.params;

  // Validate userId and courseId
  if (!userId || userId === 'null' || userId === 'undefined' || userId.length !== 24) {
    return res.status(400).json({ error: 'Invalid userId' });
  }
  if (!courseId || courseId === 'undefined' || courseId.length !== 24) {
    return res.status(400).json({ error: 'Invalid courseId' });
  }

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
