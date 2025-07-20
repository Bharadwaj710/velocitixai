// server/controller/aiInterviewController.js
const InterviewSession = require("../models/InterviewSession");
const cloudinary = require("../utlis/cloudinary");
const axios = require("axios");
const FormData = require("form-data");
const { jwtDecode } = require("jwt-decode"); // ✅ correct for CommonJS

exports.startInterview = async (req, res) => {
  try {
    const courseId = req.query.courseId; // Get courseId from query string

    if (!courseId) {
      return res.status(400).json({ error: "Missing courseId in request" });
    }

    const profileRes = await axios.get(
      `http://localhost:5001/initial-question/${req.user.id}?courseId=${courseId}`
    );

    console.log("🔁 Flask API Response:", profileRes.data);

    return res.json({ question: profileRes.data.question });
  } catch (err) {
    console.error("Start interview error:", err.message || err);
    return res
      .status(500)
      .json({ error: "Failed to generate first question." });
  }
};

exports.nextQuestion = async (req, res) => {
  const { answer, index, transcript } = req.body;

  try {
    if (index >= 9) {
      return res.json({ finished: true });
    }

    const finalAnswer = transcript?.trim() || answer?.trim();
    if (!finalAnswer) {
      return res
        .status(400)
        .json({ error: "No answer or transcript provided" });
    }

    // ✅ Extract token and decode
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    const decoded = token ? jwtDecode(token) : {};
    const proficiency = decoded?.proficiency || "Beginner";

    const aiResponse = await axios.post(
      "http://localhost:5001/generate-next-question",
      {
        previousAnswer: finalAnswer,
        questionIndex: index,
        studentId: req.user.id,
        courseId: req.query.courseId,
        proficiency,
      }
    );

    const nextQ = aiResponse.data?.nextQuestion;
    res.json({ question: nextQ, finished: false });
  } catch (err) {
    console.error("❌ Next question error:", err.message, err.response?.data);
    res.status(500).json({ error: "Failed to generate next question." });
  }
};

exports.checkCheating = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Frame missing" });

    const form = new FormData();
    form.append("frame", req.file.buffer, req.file.originalname);

    const result = await axios.post("http://localhost:8000/check-frame", form, {
      headers: form.getHeaders(),
    });

    res.json(result.data);
  } catch (err) {
    console.error("Cheating check failed:", err.message);
    res.status(500).json({ error: "Cheating detection failed." });
  }
};

exports.terminateInterview = async (req, res) => {
  // Optional: store reason for termination, or log it
  res.json({ message: "Interview terminated due to suspicious activity." });
};

exports.completeInterview = async (req, res) => {
  const { answers, timestamps } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No video uploaded" });

  try {
    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      file.stream.pipe(stream);
    });

    const cloudResult = await uploadPromise;

    const analysis = await axios.post("http://localhost:5001/analyze-session", {
      videoUrl: cloudResult.secure_url,
      answers: JSON.parse(answers),
      timestamps: JSON.parse(timestamps),
      studentId: req.user.id,
    });

    const session = await InterviewSession.create({
      student: req.user.id,
      videoUrl: cloudResult.secure_url,
      answers: JSON.parse(answers),
      timestamps: JSON.parse(timestamps),
      report: analysis.data,
    });

    res.json({ message: "Interview complete", session });
  } catch (err) {
    console.error("Interview completion failed:", err.message);
    res.status(500).json({ error: "Failed to complete interview." });
  }
};
