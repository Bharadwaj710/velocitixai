// server/controller/aiInterviewController.js
const InterviewSession = require("../models/InterviewSession");
const InterviewReport = require("../models/InterviewReport");
const { cloudinary } = require("../utlis/cloudinary");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { jwtDecode } = require("jwt-decode"); // CommonJS

// Helper: safe read
const safe = (v, fallback) => (typeof v === "undefined" ? fallback : v);

// NEW: helper to upload either a multer buffer or a local file path to Cloudinary
const uploadToCloudinary = async (file, opts = {}) => {
  if (!file) throw new Error("No file provided for upload");

  // If multer provided a buffer (memory storage)
  if (file.buffer && file.buffer instanceof Buffer) {
    // Convert buffer to data URI to upload via cloudinary.uploader.upload
    const mime = file.mimetype || "application/octet-stream";
    const base64 = file.buffer.toString("base64");
    const dataUri = `data:${mime};base64,${base64}`;
    const res = await cloudinary.uploader.upload(dataUri, {
      resource_type: "auto",
      ...opts,
    });
    return res;
  }

  // If multer/disk or other provided a path
  if (file.path && fs.existsSync(file.path)) {
    const res = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      ...opts,
    });
    // optional: remove local file if it's a temporary upload
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      // ignore cleanup errors
    }
    return res;
  }

  // Fallback: some libraries set file.url or file.secure_url already
  if (file.secure_url || file.url) {
    return { secure_url: file.secure_url || file.url };
  }

  throw new Error("Unsupported file object for Cloudinary upload");
};

// 🧠 Interview flow
exports.startInterview = async (req, res) => {
  try {
    const courseId = req.query.courseId;
    const userId = req.user?.id || req.body.studentId;

    if (!courseId) {
      return res.status(400).json({ error: "Missing courseId in request" });
    }

    // 🆕 Reset Python detector state for this user
    try {
      await axios.post(
        `http://127.0.0.1:5001/reset/${userId}`,
        {},
        { timeout: 4000 }
      );
      console.log(`[StartInterview] Reset python detector for user=${userId}`);
    } catch (err) {
      console.warn("⚠️ Could not reset python detector:", err.message);
      // don’t block interview if reset fails — just continue
    }

    // Fetch first AI-generated question
    let firstQuestion;
    try {
      const profileRes = await axios.get(
        `http://127.0.0.1:5001/initial-question/${userId}?courseId=${courseId}`,
        { timeout: 30000 }
      );
      firstQuestion = profileRes.data.question;
    } catch (err) {
      console.error("❌ Could not fetch first question:", err.message);
      return res
        .status(500)
        .json({ error: "AI service unavailable, try again later." });
    }

    // Find existing session or create new
    let session = await InterviewSession.findOne({
      student: userId,
      course: courseId,
    });

    if (!session) {
      session = new InterviewSession({
        student: userId,
        course: courseId,
        answers: [],
        questions: [{ index: 0, question: firstQuestion }],
        skippedQuestions: [],
        notAttemptedQuestions: [],
        timestamps: [],
        lastGeneratedQuestion: { index: 0, question: firstQuestion },
        status: "in-progress", // ✅ force fresh status
        cheatingAttempts: 3,
        cheatingDetected: false,
        cheatingWarning: false,
      });
      await session.save();
      console.log(`[StartInterview] New session created for user=${userId}`);
    } else {
      // ✅ Reset session for fresh attempt
      session.status = "in-progress"; // <-- CRITICAL: reset from 'terminated'
      session.cheatingAttempts = 3;
      session.cheatingDetected = false;
      session.cheatingWarning = false;
      session.answers = [];
      session.skippedQuestions = [];
      session.notAttemptedQuestions = [];
      session.timestamps = [];
      session.questions = [{ index: 0, question: firstQuestion }];
      session.lastGeneratedQuestion = { index: 0, question: firstQuestion };
      await session.save();
      console.log(`[StartInterview] Reset session for user=${userId}`);
    }

    return res.json({ question: firstQuestion });
  } catch (err) {
    console.error("Start interview error:", err.message || err);
    return res.status(500).json({ error: "Failed to start interview." });
  }
};

exports.nextQuestion = async (req, res) => {
  const { answer, transcript, skip, timedOut } = req.body;
  const userId = req.user?.id || req.body.studentId;
  const courseId = req.query.courseId;

  try {
    const session = await InterviewSession.findOne({
      student: userId,
      course: courseId,
    });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const lastQ = session.lastGeneratedQuestion || {};
    const currentIndex = typeof lastQ.index === "number" ? lastQ.index : 0;
    const currentText = lastQ.question || "";

    const isSkip = !!skip;
    const isTimedOut = !!timedOut;

    const alreadyAnswered = session.answers.some(
      (a) => a.index === currentIndex && a.answer.trim() !== ""
    );

    // Timeout flow: move to notAttempted
    if (isTimedOut && currentText && !alreadyAnswered) {
      session.skippedQuestions = session.skippedQuestions.filter(
        (q) => q.index !== currentIndex
      );
      session.notAttemptedQuestions = session.notAttemptedQuestions.filter(
        (q) => q.index !== currentIndex
      );

      session.notAttemptedQuestions.push({
        index: currentIndex,
        question: currentText,
      });

      session.markModified("notAttemptedQuestions");
      session.markModified("skippedQuestions");
      await session.save();
    }

    if (isSkip && currentText) {
      const alreadyInSkip = session.skippedQuestions.some(
        (q) => q.index === currentIndex
      );
      if (!alreadyInSkip) {
        session.skippedQuestions.push({
          index: currentIndex,
          question: currentText,
        });
        session.markModified("skippedQuestions");
      }
    }

    const generatedIndexes = new Set([
      ...session.questions.map((q) => q.index),
      ...session.notAttemptedQuestions.map((q) => q.index),
      ...session.answers.map((q) => q.index),
      ...session.skippedQuestions.map((q) => q.index),
    ]);

    // If done -> revisit skipped questions first
    if (generatedIndexes.size >= 10) {
      const revisit = session.skippedQuestions.sort(
        (a, b) => a.index - b.index
      )[0];
      if (revisit) {
        session.lastGeneratedQuestion = {
          index: revisit.index,
          question: revisit.question,
        };
        session.markModified("lastGeneratedQuestion");
        await session.save();
        return res.json({
          question: revisit.question,
          revisitIndex: revisit.index,
          finished: false,
          isRevisit: true,
          disableSkip: true,
        });
      }
      return res.json({ finished: true });
    }

    // pick next free index
    const usedIndexes = new Set(
      [
        ...session.questions,
        ...session.answers,
        ...session.notAttemptedQuestions,
        ...session.skippedQuestions,
      ].map((q) => q.index)
    );

    let nextIndex = 0;
    while (usedIndexes.has(nextIndex)) nextIndex++;

    const latest = await InterviewSession.findOne({
      student: userId,
      course: courseId,
    });
    const already = latest.questions.find((q) => q.index === nextIndex);
    if (already) {
      session.lastGeneratedQuestion = {
        index: already.index,
        question: already.question,
      };
      await session.save();
      return res.json({
        question: already.question,
        index: already.index,
        finished: false,
      });
    }

    const token = req.headers.authorization?.split(" ")[1];
    const decoded = token ? jwtDecode(token) : {};
    const proficiency = decoded?.proficiency || "Beginner";

    const usedQuestionsText = new Set(
      [
        ...session.questions,
        ...session.skippedQuestions,
        ...session.notAttemptedQuestions,
      ].map((q) => q.question.trim().toLowerCase())
    );

    let finalQuestion = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const aiRes = await axios.post(
        "http://localhost:5001/generate-next-question",
        {
          previousAnswer: isSkip
            ? "Skipped"
            : isTimedOut
            ? ""
            : transcript || answer,
          questionIndex: nextIndex,
          studentId: userId,
          courseId,
          proficiency,
          skip: isSkip,
          timedOut: isTimedOut,
        }
      );

      const generated = aiRes.data?.nextQuestion?.trim();
      if (generated && !usedQuestionsText.has(generated.toLowerCase())) {
        finalQuestion = generated;
        break;
      }
    }

    if (!finalQuestion) {
      return res
        .status(409)
        .json({ error: "Duplicate question after retries" });
    }

    session.questions.push({ index: nextIndex, question: finalQuestion });
    session.lastGeneratedQuestion = {
      index: nextIndex,
      question: finalQuestion,
    };
    session.markModified("questions");
    session.markModified("lastGeneratedQuestion");
    await session.save();

    return res.json({
      question: finalQuestion,
      index: nextIndex,
      finished: false,
    });
  } catch (err) {
    console.error("❌ nextQuestion error:", err.message);
    return res.status(500).json({ error: "Failed to generate next question" });
  }
};

exports.saveAnswer = async (req, res) => {
  const { question, answer, index, studentId, timedOut, skip, courseId } =
    req.body;

  try {
    const session = await InterviewSession.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        $setOnInsert: {
          student: studentId,
          course: courseId,
          status: "in-progress",
          answers: [],
          questions: [],
          skippedQuestions: [],
          notAttemptedQuestions: [],
          lastGeneratedQuestion: { index: 0, question: "" },
          cheatingAttempts: 3,
          cheatingDetected: false,
          cheatingWarning: false,
        },
      },
      { new: true, upsert: true }
    );

    const finalIndex = typeof index === "number" ? index : 0;
    const questionText = question?.trim() || "";
    const trimmedAnswer = typeof answer === "string" ? answer.trim() : "";

    if (trimmedAnswer === "" && !timedOut && !skip) {
      return res
        .status(400)
        .json({ error: "Empty answer without skip or timeout" });
    }

    // Timeout: move to notAttempted
    if (timedOut && trimmedAnswer === "" && questionText) {
      session.skippedQuestions = session.skippedQuestions.filter(
        (q) => q.index !== finalIndex
      );
      session.notAttemptedQuestions = session.notAttemptedQuestions.filter(
        (q) => q.index !== finalIndex
      );

      session.notAttemptedQuestions.push({
        index: finalIndex,
        question: questionText,
      });
      session.answers = session.answers.filter((a) => a.index !== finalIndex);

      session.markModified("answers");
      session.markModified("skippedQuestions");
      session.markModified("notAttemptedQuestions");

      await session.save();
      return res.json({ message: "Timeout: moved to notAttempted" });
    }

    // Skip flow
    if (skip && questionText) {
      if (!session.skippedQuestions.some((q) => q.index === finalIndex)) {
        session.skippedQuestions.push({
          index: finalIndex,
          question: questionText,
        });
        session.markModified("skippedQuestions");
      }
      if (!session.questions.some((q) => q.index === finalIndex)) {
        session.questions.push({ index: finalIndex, question: questionText });
        session.markModified("questions");
      }
      await session.save();
      return res.json({ message: "Skipped" });
    }

    // Normal answer
    if (trimmedAnswer !== "") {
      const existing = session.answers.find((a) => a.index === finalIndex);
      if (existing) {
        existing.answer = trimmedAnswer;
      } else {
        session.answers.push({ index: finalIndex, answer: trimmedAnswer });
      }

      session.skippedQuestions = session.skippedQuestions.filter(
        (q) => q.index !== finalIndex
      );
      session.notAttemptedQuestions = session.notAttemptedQuestions.filter(
        (q) => q.index !== finalIndex
      );

      if (!session.questions.some((q) => q.index === finalIndex)) {
        session.questions.push({ index: finalIndex, question: questionText });
        session.markModified("questions");
      }

      session.markModified("answers");
      await session.save();
      return res.json({ message: "Answer saved" });
    }

    return res.status(400).json({ error: "Invalid request" });
  } catch (err) {
    console.error("❌ saveAnswer error:", err.message);
    return res.status(500).json({ error: "Failed to save answer" });
  }
};

exports.checkCheating = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Missing frame" });

    const form = new FormData();
    form.append("frame", req.file.buffer, req.file.originalname);

    let result;
    try {
      // send to python detector
      result = await axios.post("http://127.0.0.1:5001/check-frame", form, {
        headers: form.getHeaders(),
        timeout: 5000,
      });
    } catch (err) {
      console.error("❌ Cheating service unavailable:", err.message);
      return res.status(500).json({ error: "Cheating service unavailable" });
    }

    const {
      cheating,
      critical = [],
      reasons = [],
      metrics = {},
      baseline_ready = false,
    } = result.data || {};

    // If no user (debug), just return raw detector output
    if (!req.user?.id) {
      return res.json({ ...result.data });
    }

    const session = await InterviewSession.findOne({ student: req.user.id });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Ensure attempts field exists
    if (typeof session.cheatingAttempts !== "number") {
      session.cheatingAttempts = 3;
      await session.save();
    }

    // If already terminated, keep returning terminated without changes
    if (session.status === "terminated") {
      console.log(
        `[Cheating Check] session already terminated user=${req.user.id}`
      );
      return res.json({
        ...result.data,
        cheatingAttempts: session.cheatingAttempts,
        status: "terminated",
      });
    }

    // If calibration still in progress - don't penalize
    // If calibration still in progress - don't penalize
    if (!baseline_ready) {
      console.log(
        `[Cheating Check] calibration in progress (user=${req.user.id})`
      );
      return res.json({
        ...result.data,
        cheating: false,
        critical: [],
        reasons: [], // 🚨 force empty reasons
        cheatingAttempts: session.cheatingAttempts ?? 3,
        status: session.status || "in-progress",
        toastType: "info",
        toastMessage:
          "Calibrating face baseline — please face the camera steadily.",
      });
    }
    // After baseline ready:
    let attempts = session.cheatingAttempts ?? 3;

    // Critical events (no face / multiple faces) -> decrement attempts (atomic)
    // Critical events (no face / multiple faces) -> only decrement if Python says cheating=true
    if (Array.isArray(critical) && critical.length > 0) {
      if (cheating) {
        // ✅ Python already applied grace → now it's a confirmed critical
        const updated = await InterviewSession.findOneAndUpdate(
          { _id: session._id, cheatingAttempts: { $gt: 0 } },
          { $inc: { cheatingAttempts: -1 } },
          { new: true }
        );

        const updatedAttempts = updated ? updated.cheatingAttempts : attempts;
        console.log(
          `[Cheating Check] CRITICAL=${critical.join(" | ")} user=${
            req.user.id
          } attemptsLeft=${updatedAttempts}`
        );

        if (updatedAttempts <= 0) {
          await InterviewSession.findByIdAndUpdate(session._id, {
            cheatingAttempts: 0,
            cheatingDetected: true,
            status: "terminated",
          });
          return res.json({
            ...result.data,
            cheatingAttempts: 0,
            status: "terminated",
            toastType: "critical",
            toastMessage:
              "🚨 Interview terminated: too many critical violations.",
          });
        }

        return res.json({
          ...result.data,
          cheatingAttempts: updatedAttempts,
          status: "in-progress",
          toastType: "critical",
          toastMessage: `❌ ${critical.join(
            " | "
          )}. Attempts left: ${updatedAttempts}`,
        });
      } else {
        // 🚨 First detection within grace period → just show warning toast, no attempt decrement
        return res.json({
          ...result.data,
          cheatingAttempts: session.cheatingAttempts ?? 3,
          status: "in-progress",
          toastType: "critical",
          toastMessage: `❌ ${critical.join(" | ")} — please face the camera.`,
        });
      }
    }
    // Warnings (head tilt / yaw) -> do not decrement attempts, only set warning flag
    if (Array.isArray(reasons) && reasons.length > 0) {
      await InterviewSession.findByIdAndUpdate(session._id, {
        cheatingWarning: true,
      });

      const isHeadTilt = reasons.some(
        (r) =>
          r.toLowerCase().includes("head turned") ||
          r.toLowerCase().includes("head tilted")
      );

      console.log(`[Cheating Check] WARNING=${reasons} user=${req.user.id}`);

      return res.json({
        ...result.data,
        cheatingAttempts: session.cheatingAttempts ?? 3,
        status: session.status || "in-progress",
        toastType: isHeadTilt ? "critical" : "warning", // head tilt red toast, others yellow
        toastMessage: `${isHeadTilt ? "❌" : "⚠️"} ${reasons.join(
          " | "
        )} — please look at the camera.`,
      });
    }
    // No issues
    return res.json({
      ...result.data,
      cheatingAttempts: session.cheatingAttempts ?? 3,
      status: session.status || "in-progress",
      toastType: "none",
    });
  } catch (err) {
    console.error("Error in checkCheating:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.terminateInterview = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No video uploaded" });

    const studentId = req.user.id;
    const uploadResult = await uploadToCloudinary(req.file, {
      folder: "ai_interviews",
    });
    const videoUrl = uploadResult.secure_url || uploadResult.url;

    // ✅ Update session
    const session = await InterviewSession.findOneAndUpdate(
      { student: studentId },
      { $set: { status: "terminated", cheatingDetected: true } },
      { new: true }
    );
    if (!session) return res.status(404).json({ error: "Session not found" });

    // ✅ Delete any previous report for same student & course
    await InterviewReport.deleteMany({
      student: studentId,
      course: session.course,
    });

    // Analyze
    let analysisResult = {};
    try {
      const { data } = await axios.post("http://localhost:5001/analyze-session", {
        videoUrl,
        answers: session.answers,
        timestamps: session.timestamps,
        questions: session.questions,
        studentId,
        terminated: true,
      });
      analysisResult = data;
    } catch (err) {
      console.warn("⚠️ Python analysis failed (terminate):", err.message);
      analysisResult = {};
    }

    // ✅ Build transcripts — fallback to session data
    const answersMap = (session.answers || []).reduce((acc, a) => {
      acc[a.index] = a.answer || "";
      return acc;
    }, {});

    const transcriptsToSave =
      (analysisResult.transcripts && analysisResult.transcripts.length > 0)
        ? analysisResult.transcripts.map((t) => ({
            question: t.question,
            start: t.start,
            end: t.end,
            text: t.text || "",
          }))
        : (session.questions || []).map((q) => ({
            question: q.question,
            start: null,
            end: null,
            text: answersMap[q.index] || "",
          }));

    // ✅ Create new report
    const report = await InterviewReport.create({
      student: studentId,
      session: session._id,
      course: session.course,
      videoUrl,
      overallScores: analysisResult.overallScores || {},
      perQuestion: analysisResult.perQuestion || [],
      transcripts: transcriptsToSave,
    });

    res.json({
      message: "Interview terminated and analyzed successfully.",
      report,
    });
  } catch (err) {
    console.error("❌ terminateInterview failed:", err.message || err);
    res.status(500).json({ error: "Failed to terminate interview" });
  }
};

exports.completeInterview = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No video uploaded" });

    const studentId = req.user.id;
    const { answers, timestamps, questions } = req.body;

    // Upload video
    let uploadResult = await uploadToCloudinary(req.file, {
      folder: "ai_interviews",
    });
    const videoUrl = uploadResult.secure_url || uploadResult.url;

    // ✅ Find latest session
    const session = await InterviewSession.findOneAndUpdate(
      { student: studentId },
      {
        $set: {
          status: "completed",
          answers: JSON.parse(answers),
          timestamps: JSON.parse(timestamps),
          questions: JSON.parse(questions),
        },
      },
      { new: true }
    );

    if (!session) return res.status(404).json({ error: "Session not found" });

    // ✅ Delete any existing report for same student + course
    await InterviewReport.deleteMany({
      student: studentId,
      course: session.course,
    });

    // Analyze via Python service
    let analysis = {};
    try {
      const { data } = await axios.post("http://localhost:5001/analyze-session", {
        videoUrl,
        answers: JSON.parse(answers),
        timestamps: JSON.parse(timestamps),
        questions: JSON.parse(questions),
        studentId,
      });
      analysis = data;
    } catch (err) {
      console.warn("⚠️ Python analysis failed:", err.message);
      analysis = {};
    }

    // ✅ Build transcripts: prefer analysis, else derive from session
    const answersMap = (session.answers || []).reduce((acc, a) => {
      acc[a.index] = a.answer || "";
      return acc;
    }, {});

    const transcriptsToSave =
      (analysis.transcripts && analysis.transcripts.length > 0)
        ? analysis.transcripts.map((t) => ({
            question: t.question,
            start: t.start,
            end: t.end,
            text: t.text || "",
          }))
        : (session.questions || []).map((q) => ({
            question: q.question,
            start: null,
            end: null,
            text: answersMap[q.index] || "",
          }));

    // ✅ Build per-question list
    const perQuestionToSave = (analysis.perQuestion || []).map((p, i) => {
      const idx =
        typeof p.index === "number" ? p.index : parseInt(p.index || i, 10);
      const sessQ = (session.questions || []).find((q) => q.index === idx);
      return {
        index: idx,
        question: p.question || sessQ?.question || `Question ${idx}`,
        answer:
          p.answer ||
          (session.answers || []).find((a) => a.index === idx)?.answer ||
          "",
        scores: p.scores || {},
        feedback: p.feedback || "",
      };
    });

    // ✅ Save final report
    const report = await InterviewReport.create({
      student: studentId,
      session: session._id,
      course: session.course,
      videoUrl,
      overallScores: analysis.overallScores || {},
      perQuestion: perQuestionToSave,
      transcripts: transcriptsToSave,
    });

    res.json({
      message: "Interview completed and analyzed successfully.",
      report,
    });
  } catch (err) {
    console.error("❌ Interview completion failed:", err.message || err);
    res.status(500).json({ error: "Failed to complete interview." });
  }
};

exports.getReport = async (req, res) => {
  try {
    const { sessionId } = req.params;

    let report = null;

    // 1️⃣ Try finding by Report ID
    if (sessionId.match(/^[0-9a-fA-F]{24}$/)) {
      report = await InterviewReport.findById(sessionId).populate("session");
    }

    // 2️⃣ Try finding by Session ID
    if (!report) {
      report = await InterviewReport.findOne({ session: sessionId }).populate("session");
    }

    // 3️⃣ Try finding by Course ID
    if (!report) {
      report = await InterviewReport.findOne({ course: sessionId }).populate("session");
    }

    if (!report) {
      return res.status(404).json({ error: "Report not found for given ID" });
    }

    // 4️⃣ Fetch the actual interview session
    const session =
      (report.session?._id && (await InterviewSession.findById(report.session._id))) ||
      (await InterviewSession.findOne({ course: report.course, student: report.student }));

    // 5️⃣ Merge session data into response for frontend
    if (session) {
      report = {
        ...report.toObject(),
        sessionDetails: {
          questions: session.questions || [],
          answers: session.answers || [],
          skippedQuestions: session.skippedQuestions || [],
          notAttemptedQuestions: session.notAttemptedQuestions || [],
          cheatingDetected: session.cheatingDetected || false,
          cheatingWarning: session.cheatingWarning || false,
          cheatingAttempts: session.cheatingAttempts ?? 3,
        },
      };
    }

    res.json(report);
  } catch (err) {
    console.error("getReport error:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
};

exports.getLatestSession = async (req, res) => {
  try {
    const { studentId } = req.params;

    // find the most recent interview session by this student
    const session = await InterviewSession.findOne({ student: studentId })
      .sort({ createdAt: -1 })
      .exec();

    if (!session) {
      return res.status(404).json({ error: "No session found" });
    }

    res.json(session);
  } catch (err) {
    console.error("getLatestSession error:", err);
    res.status(500).json({ error: "Failed to fetch latest session" });
  }
};

exports.getSessionByCourse = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    const session = await InterviewSession.findOne({
      student: studentId,
      course: courseId,
    });

    if (!session) {
      return res.status(200).json({ status: "not-started" }); // instead of 404
    }

    res.json({ status: session.status });
  } catch (err) {
    console.error("getSessionByCourse error:", err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
};
