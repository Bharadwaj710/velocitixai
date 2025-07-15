// Shared object to track progress
const progressMap = {};

// Set progress for a specific lesson
function setProgress(lessonId, type, percent) {
  progressMap[lessonId] = { type, progress: percent };
}

// Get progress
function getProgress(lessonId) {
  return progressMap[lessonId] || { type: null, progress: 0 };
}

// Clear progress (when done)
function clearProgress(lessonId) {
  delete progressMap[lessonId];
}

module.exports = {
  setProgress,
  getProgress,
  clearProgress,
};
