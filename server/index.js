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

// Create express app
const app = express();

// -----------------------------------------------------
// 1️⃣ CORS CONFIG (FULLY PRODUCTION SAFE)
// -----------------------------------------------------
const allowedOrigins = [
  "http://localhost:5173",                                 // Local DEV
  "http://localhost:3000",                                 // CRA Local DEV
  process.env.FRONTEND_URL                                 // Production Frontend
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ BLOCKED ORIGIN:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));

// -----------------------------------------------------
// 2️⃣ Multer Setup
// -----------------------------------------------------
const upload = multer({ dest: "uploads/" });

// -----------------------------------------------------
// 3️⃣ Express Routes
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
app.use("/api/transcripts", transcriptRoutes);
app.use("/api/notes", require("./routes/notes"));
app.use("/api/quiz", require("./routes/quizRoutes"));
app.use("/api/lessons", require("./routes/lessonRoutes"));
app.use("/api/notifications", notificationRoutes);
app.use("/api/aiInterview", require("./routes/aiInterview"));

app.use("/uploads", express.static("uploads"));

// -----------------------------------------------------
// 4️⃣ Whisper / Python AI Microservice Proxy
// -----------------------------------------------------
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const aiURL = process.env.AI_SERVICE_URL;

    if (!aiURL) {
      return res.status(500).json({ error: "AI_SERVICE_URL missing in .env" });
    }

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(`${aiURL}/transcribe`, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    fs.unlinkSync(filePath);

    return res.json(response.data);
  } catch (error) {
    console.error("🔴 AI-ERROR:", error?.response?.data || error.message);
    res.status(500).json({ error: "AI Service Failure" });
  }
});

// -----------------------------------------------------
// 5️⃣ Overview Stats Endpoint
// -----------------------------------------------------
const { getOverviewStats } = require("./controller/userController");
app.get("/api/stats/overview", getOverviewStats);

// -----------------------------------------------------
// 6️⃣ Root Health Check
// -----------------------------------------------------
app.get("/", (req, res) => {
  res.send("🚀 Velocitix AI Backend Running Successfully!");
});

// -----------------------------------------------------
// 7️⃣ Start Server
// -----------------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🟢 BACKEND LIVE on PORT: ${PORT}`);
  console.log("Allowed CORS Origins =>", allowedOrigins);
});
