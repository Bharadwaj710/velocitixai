require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
require("./config/db");

// Routers
const AuthRouter = require("./routes/auth");
const collegeRoutes = require("./routes/college");
const progressRoutes = require("./routes/progressRoutes");
const notificationRoutes = require("./routes/notifications");
const hrRoutes = require("./routes/hr");
const transcriptRoutes = require("./routes/transcriptRoutes");

const app = express();

// -----------------------------------------------------
// 1️⃣  CORS CONFIG
// -----------------------------------------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",                       // Local
      "https://velocitixai-sao9.vercel.app"          // Production Frontend (NO trailing slash)
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());

// -----------------------------------------------------
// 2️⃣ Multer Setup
// -----------------------------------------------------
const upload = multer({ dest: "uploads/" });

// -----------------------------------------------------
// 3️⃣ API Routes
// -----------------------------------------------------
app.use("/admin", require("./routes/admin"));
app.use("/api/users", require("./routes/user"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/students", require("./routes/student"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api", require("./routes/recommendations"));
app.use("/api/progress", progressRoutes);
app.use("/api/college", collegeRoutes);
app.use("/api/assessment", require("./routes/assessment"));
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
app.use("/api/transcripts", transcriptRoutes);
app.use("/uploads", express.static("uploads"));

// -----------------------------------------------------
// 4️⃣ Whisper / AI Microservice Route (NEW)
// -----------------------------------------------------
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const aiURL = process.env.AI_SERVICE_URL; // Example: https://velocitix-ai.onrender.com

    if (!aiURL) {
      return res.status(500).json({ error: "AI Service URL not configured" });
    }

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(`${aiURL}/transcribe`, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    fs.unlinkSync(filePath); // delete uploaded file

    return res.json(response.data);
  } catch (error) {
    console.error("AI Error:", error?.response?.data || error.message);
    res.status(500).json({ error: "AI processing failed" });
  }
});

// -----------------------------------------------------
// 5️⃣ Overview Stats
// -----------------------------------------------------
const { getOverviewStats } = require("./controller/userController");
app.get("/api/stats/overview", getOverviewStats);

// -----------------------------------------------------
// 6️⃣ Root Route
// -----------------------------------------------------
app.get("/", (req, res) => {
  res.send("Velocitix AI Backend is Running");
});

// -----------------------------------------------------
// 7️⃣ Start Server
// -----------------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
