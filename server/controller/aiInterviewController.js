// server/controller/aiInterviewController.js
const InterviewSession = require("../models/InterviewSession");
const cloudinary = require("../utlis/cloudinary");
const axios = require("axios");
const FormData = require("form-data");
const { jwtDecode } = require("jwt-decode"); // ✅ correct for CommonJS

exports.startInterview = async (req, res) => {
  try {
    const courseId = req.query.courseId;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ error: "Missing courseId in request" });
    }

    const profileRes = await axios.get(
      `http://localhost:5001/initial-question/${userId}?courseId=${courseId}`
    );

    const firstQuestion = profileRes.data.question;

    // Save session with first question
    let session = await InterviewSession.findOne({
      student: userId,
      course: courseId,
    });
    if (!session) {
      session = new InterviewSession({
        student: userId,
        answers: [],
        questions: [{ index: 0, question: firstQuestion }],
        skippedQuestions: [],
        notAttemptedQuestions: [],
        timestamps: [],
        lastGeneratedQuestion: { index: 0, question: firstQuestion },
        status: "in-progress",
      });
    } else {
      // Only if first question not added already
      const alreadyExists = session.questions.some((q) => q.index === 0);
      if (!alreadyExists) {
        session.questions.push({ index: 0, question: firstQuestion });
        session.lastGeneratedQuestion = { index: 0, question: firstQuestion };
      }
    }

    await session.save();

    return res.json({ question: firstQuestion });
  } catch (err) {
    console.error("Start interview error:", err.message || err);
    return res
      .status(500)
      .json({ error: "Failed to generate first question." });
  }
};

exports.nextQuestion = async (req, res) => {
  const { answer, transcript, skip, timedOut } = req.body;
  const userId = req.user?.id;
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

    // ✅ Handle revisit timeout as well
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

    // 🛑 If done, pick revisit first
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
        },
      },
      { new: true, upsert: true }
    );

    const finalIndex = typeof index === "number" ? index : 0;
    const questionText = question?.trim() || "";
    const trimmedAnswer = typeof answer === "string" ? answer.trim() : "";

    // 🚫 Block empty answer unless skip/timeout
    if (trimmedAnswer === "" && !timedOut && !skip) {
      return res
        .status(400)
        .json({ error: "Empty answer without skip or timeout" });
    }

    // 🕒 Timeout: move skipped → notAttempted
    if (timedOut && trimmedAnswer === "" && questionText) {
      // Remove from skipped (revisit timeout case)
      session.skippedQuestions = session.skippedQuestions.filter(
        (q) => q.index !== finalIndex
      );

      // Remove old notAttempted if exists
      session.notAttemptedQuestions = session.notAttemptedQuestions.filter(
        (q) => q.index !== finalIndex
      );

      // Add to notAttempted
      session.notAttemptedQuestions.push({
        index: finalIndex,
        question: questionText,
      });

      // Remove any existing answer
      session.answers = session.answers.filter((a) => a.index !== finalIndex);

      session.markModified("answers");
      session.markModified("skippedQuestions");
      session.markModified("notAttemptedQuestions");

      await session.save();
      return res.json({ message: "Timeout: moved to notAttempted" });
    }

    // ⏭ Skip flow
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

    // ✏ Normal answer flow
    if (trimmedAnswer !== "") {
      const existing = session.answers.find((a) => a.index === finalIndex);
      if (existing) {
        existing.answer = trimmedAnswer;
      } else {
        session.answers.push({ index: finalIndex, answer: trimmedAnswer });
      }

      // Remove from skipped & notAttempted
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
    if (!req.file) return res.status(400).json({ error: "Frame missing" });

    const form = new FormData();
    form.append("frame", req.file.buffer, req.file.originalname);

    const result = await axios.post("http://localhost:5000/check-frame", form, {
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
  const { answers, timestamps, questions } = req.body;
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
      questions: JSON.parse(questions),
      studentId: req.user.id,
    });

    const session = await InterviewSession.findOneAndUpdate(
      { student: req.user.id },
      {
        $set: {
          videoUrl: cloudResult.secure_url,
          answers: JSON.parse(answers),
          timestamps: JSON.parse(timestamps),
          questions: JSON.parse(questions),
          report: analysis.data,
          status: "completed", // ✅ update status
        },
      },
      { new: true }
    );

    // Attach skipped questions and their answer status
    const skippedSummary = (session.skippedQuestions || []).map((q) => ({
      index: q.index,
      question: q.question,
      answer: session.answers[q.index] || "not attempted",
    }));

    res.json({
      message: "Interview complete",
      session,
      skippedQuestions: skippedSummary,
    });
  } catch (err) {
    console.error("Interview completion failed:", err.message);
    res.status(500).json({ error: "Failed to complete interview." });
  }
};
