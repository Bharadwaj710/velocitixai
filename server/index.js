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

/* -----------------------------------------------------
   1️⃣ CORS CONFIG (PRODUCTION SAFE)
------------------------------------------------------ */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS BLOCKED:", origin);
        callback(new Error("CORS Not Allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

// 🔧 REQUIRED: allow browser preflight OPTIONS calls
app.options("*", cors());

app.use(express.json({ limit: "50mb" }));

/* -----------------------------------------------------
   2️⃣ Multer Setup (File Uploads)
------------------------------------------------------ */
const upload = multer({ dest: "uploads/" });

/* -----------------------------------------------------
   3️⃣ Express Routes
------------------------------------------------------ */
app.use("/auth", AuthRouter); // 🔧 IMPORTANT: add missing route mount
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

// static files
app.use("/uploads", express.static("uploads"));

/* -----------------------------------------------------
   4️⃣ Whisper / Python AI Microservice Proxy
------------------------------------------------------ */
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
  } catch (err) {
    console.error("🔴 AI_ERROR:", err?.response?.data || err.message);
    res.status(500).json({ error: "AI service failed" });
  }
});

/* -----------------------------------------------------
   5️⃣ Overview Stats
------------------------------------------------------ */
const { getOverviewStats } = require("./controller/userController");
app.get("/api/stats/overview", getOverviewStats);

/* -----------------------------------------------------
   6️⃣ Health Check Endpoint
------------------------------------------------------ */
app.get("/", (req, res) => {
  res.send("🚀 Velocitix AI Backend Running Successfully!");
});

/* -----------------------------------------------------
   7️⃣ Start Server
------------------------------------------------------ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🟢 BACKEND LIVE on PORT ${PORT}`);
  console.log("Allowed Origins:", allowedOrigins);
});
