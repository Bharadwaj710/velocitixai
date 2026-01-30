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
  process.env.FRONTEND_URL,
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
  }),
);

// 🔧 REQUIRED: allow browser preflight OPTIONS calls
// Handle browser preflight requests safely
app.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Origin",
    allowedOrigins.includes(req.headers.origin) ? req.headers.origin : "",
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  );
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));

/* -----------------------------------------------------
  2️⃣ Multer Setup (File Uploads)
  - Add conservative file-size limits for uploads (200MB)
  - Keep disk storage for proxying to AI microservice; files are removed after proxying
------------------------------------------------------ */
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 200 * 1024 * 1024 },
});

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
  const filePath = req.file?.path;
  if (!filePath)
    return res.status(400).json({ error: "No audio file uploaded" });

  const rawAiUrl = process.env.AI_SERVICE_URL || "";
  const aiURL = rawAiUrl.replace(/\/$/, "");

  if (!aiURL) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return res
      .status(500)
      .json({ error: "AI_SERVICE_URL missing in server environment" });
  }

  // Build form data and proxy the file to the AI microservice
  const formData = new FormData();
  formData.append("file", fs.createReadStream(filePath));

  try {
    const response = await axios.post(`${aiURL}/transcribe`, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000, // 2 minutes, tune as necessary for long audio
    });

    // Always respond with JSON from AI service (or normalized)
    const data = response?.data;
    return res.status(response.status || 200).json(data);
  } catch (err) {
    // Normalize error response: if AI responded with JSON, forward cleanly.
    console.error(
      "🔴 AI_PROXY_ERROR:",
      err?.response?.status,
      err?.response?.data || err.message,
    );
    if (err.response && err.response.data) {
      // Try to forward AI service JSON error and status
      const status = err.response.status || 502;
      return res.status(status).json({ error: err.response.data });
    }
    return res
      .status(502)
      .json({ error: "AI service failed or did not respond" });
  } finally {
    // Ensure temporary file removed in all cases to avoid disk growth
    try {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      console.warn("Failed to remove temp file:", filePath, e.message);
    }
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
