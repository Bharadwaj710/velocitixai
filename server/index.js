require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const AuthRouter = require("./routes/auth");
const collegeRoutes = require("./routes/college");
const path = require("path");
const progressRoutes = require("./routes/progressRoutes");
const notificationRoutes = require("./routes/notifications");
const multer = require("multer");
const { spawn } = require("child_process");
const fs = require("fs");
const transcriptRoutes = require('./routes/transcriptRoutes');

require("./config/db");
const hrRoutes = require("./routes/hr");
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// All your routes
app.use("/admin", require("./routes/admin"));
app.use("/api/users", require("./routes/user"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/students", require("./routes/student"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api", require("./routes/recommendations"));
app.use("/api/progress", progressRoutes);
app.use("/api/college", collegeRoutes);
app.use("/api/assessment", require("./routes/assessment"));
app.use("/uploads", express.static("uploads"));
app.use("/auth", AuthRouter);
app.use("/api/career-assessment", require("./routes/careerAssessment"));
app.use("/api/assessments", require("./routes/careerAssessment"));
app.use("/api/hr", hrRoutes);
app.use("/api/chat", require("./routes/chat"));
app.use("/api/transcripts", require("./routes/transcript"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/quiz", require("./routes/quizRoutes"));
app.use("/api/lessons", require("./routes/lessonRoutes"));
app.use("/api/notifications", notificationRoutes);
app.use("/api/aiInterview", require("./routes/aiInterview"));
app.use('/api/transcripts', transcriptRoutes);

// Models
require("./models/Student");
require("./models/HR");
require("./models/User");
require("./models/Invitation");

// Stats route
const { getOverviewStats } = require("./controller/userController");
app.get("/api/stats/overview", getOverviewStats);

// Root
app.get("/", (req, res) => {
  res.send("Velocitix AI Backend is Running");
});

// ✅ Whisper transcription using local Python script
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const audioPath = req.file.path;

    // Spawn Python process
    const pythonProcess = spawn("python3", [
      "./ai-services/transcribe.py",
      audioPath,
    ]);

    let transcription = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      transcription += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      fs.unlinkSync(audioPath); // clean up uploaded file

      if (code === 0) {
        res.json({ transcript: transcription.trim() });
      } else {
        console.error("Python error:", errorOutput);
        res.status(500).json({ error: "Transcription failed" });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Transcription failed");
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
