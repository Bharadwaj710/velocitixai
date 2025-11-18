const ChatLog = require("../models/ChatLog");
const Student = require("../models/Student");
const CareerAssessment = require("../models/CareerAssessment");
const Course = require("../models/Course");
const axios = require("axios");

exports.handleMessage = async (req, res) => {
  try {
    const { userId, messages, courseId } = req.body;


    if (!userId || !messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: "Missing or invalid userId or messages" });
    }

    // Fetch student details
    const student = await Student.findOne({ user: userId }).lean();

    // Fetch the latest career assessment
    const assessment = await CareerAssessment.findOne({ userId: userId })
      .sort({ submittedAt: -1 }) // safer than createdAt
      .lean();

    // Fetch recommended courses
    let courses = [];
    if (assessment?.recommended_courses?.length) {
      const courseIds = assessment.recommended_courses.map((c) => c._id);
      courses = await Course.find({ _id: { $in: courseIds } }).lean();
    }

    // Compose context to send to Flask
    const context = { student, assessment, courses };

    // Call Python Flask server with context + messages
    const flaskRes = await axios.post("http://localhost:5001/generate", {
      userId,
      courseId,
      messages,
    });
    console.log("Flask response:", flaskRes.data);
    const reply =
      flaskRes.data.reply || "Sorry, I couldn't process your request.";

    // Log conversation
    await ChatLog.create({
      userId,
      messages: [...messages, { sender: "bot", text: reply }],
    });

    res.json({ reply });
  } catch (err) {
    console.error("ChatController error:", err.message);
    res.status(500).json({ error: "Chatbot error" });
  }
};
exports.getSuggestions = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: "Missing userId or courseId" });
    }

    const flaskRes = await axios.post("http://localhost:5001/suggestions", {
      userId,
      courseId,
    });

    return res.json({ questions: flaskRes.data.questions || [] });
  } catch (err) {
    console.error("Suggestion fetch error:", err.message);
    return res.json({ questions: [] });
  }
};
