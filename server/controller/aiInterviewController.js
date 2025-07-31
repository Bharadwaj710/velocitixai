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
    let session = await InterviewSession.findOne({ student: userId });
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
    const session = await InterviewSession.findOne({ student: userId });
    if (!session) return res.status(404).json({ error: "Session not found" });

    const lastQ = session.lastGeneratedQuestion || {};
    const currentIndex = typeof lastQ.index === "number" ? lastQ.index : 0;

    const isSkip = skip === true;
    const isTimedOut = timedOut === true;

    const alreadyAnswered = session.answers.some(
      (a) => a.index === currentIndex && a.answer.trim() !== ""
    );

    if (isTimedOut && lastQ.question?.trim()) {
      const alreadyInNA = session.notAttemptedQuestions.some(
        (q) => q.index === currentIndex
      );
      if (!alreadyAnswered && !alreadyInNA) {
        session.notAttemptedQuestions.push({
          index: currentIndex,
          question: lastQ.question,
        });
        session.markModified("notAttemptedQuestions");
        await session.save();
      }
    }

    if (isSkip && !isTimedOut && lastQ.question?.trim()) {
      const alreadySkipped = session.skippedQuestions.some(
        (q) => q.index === currentIndex
      );
      if (!alreadySkipped) {
        session.skippedQuestions.push({
          index: currentIndex,
          question: lastQ.question,
        });
        session.markModified("skippedQuestions");
        await session.save();
      }
    }

    const uniqueQuestionIndexes = new Set([
      ...session.questions.map((q) => q.index),
      ...session.notAttemptedQuestions.map((q) => q.index),
    ]);

    const totalGenerated = uniqueQuestionIndexes.size;

    if (totalGenerated >= 10) {
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

    const allIndexes = [
      ...session.questions,
      ...session.notAttemptedQuestions,
      ...session.skippedQuestions,
    ].map((q) => q.index);
    const nextIndex = Math.max(-1, ...allIndexes) + 1;

    const token = req.headers.authorization?.split(" ")[1];
    const decoded = token ? jwtDecode(token) : {};
    const proficiency = decoded?.proficiency || "Beginner";

    let nextQ = null;
    let attempts = 0;

    while (attempts < 3 && !nextQ) {
      const aiRes = await axios.post(
        "http://localhost:5001/generate-next-question",
        {
          previousAnswer: isSkip
            ? "Skipped"
            : isTimedOut
            ? "Timed out"
            : transcript || answer,
          questionIndex: nextIndex,
          studentId: userId,
          courseId,
          proficiency,
          skip: isSkip,
          timedOut: isTimedOut,
        }
      );

      const candidate = aiRes.data?.nextQuestion;
      const alreadyAsked = session.questions.some(
        (q) => q.question === candidate
      );

      if (candidate && !alreadyAsked) {
        session.questions.push({ index: nextIndex, question: candidate });
        session.lastGeneratedQuestion = {
          index: nextIndex,
          question: candidate,
        };
        session.markModified("questions");
        session.markModified("lastGeneratedQuestion");
        await session.save();
        nextQ = candidate;
      } else {
        attempts++;
      }
    }

    if (!nextQ) {
      return res.status(400).json({ error: "Failed to generate question" });
    }

    res.json({ question: nextQ, index: nextIndex, finished: false });
  } catch (err) {
    console.error("❌ nextQuestion error:", err.message);
    return res.status(500).json({ error: "Failed to generate next question" });
  }
};

exports.saveAnswer = async (req, res) => {
  const { question, answer, index, studentId, timedOut, skip } = req.body;

  try {
    const session = await InterviewSession.findOneAndUpdate(
      { student: studentId },
      {
        $setOnInsert: {
          student: studentId,
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
    const actualQuestion = question?.trim() || "";
    const isRealAnswer = !timedOut && !skip && answer.trim() !== "";

    const existingAnswer = session.answers.find((a) => a.index === finalIndex);
    const alreadyAnswered = existingAnswer?.answer?.trim() !== "";

    if (!existingAnswer) {
      session.answers.push({ index: finalIndex, answer });
    } else if (isRealAnswer) {
      existingAnswer.answer = answer;
    }
    session.markModified("answers");

    if (!session.questions.some((q) => q.index === finalIndex)) {
      session.questions.push({ index: finalIndex, question: actualQuestion });
      session.markModified("questions");
    }

    if (timedOut && !alreadyAnswered) {
      if (!session.notAttemptedQuestions.some((q) => q.index === finalIndex)) {
        session.notAttemptedQuestions.push({
          index: finalIndex,
          question: actualQuestion,
        });
        session.markModified("notAttemptedQuestions");
      }
    }

    if (skip && !timedOut && actualQuestion) {
      if (!session.skippedQuestions.some((q) => q.index === finalIndex)) {
        session.skippedQuestions.push({
          index: finalIndex,
          question: actualQuestion,
        });
        session.markModified("skippedQuestions");
      }
    }

    if (isRealAnswer) {
      session.skippedQuestions = session.skippedQuestions.filter(
        (q) => q.index !== finalIndex
      );
      session.notAttemptedQuestions = session.notAttemptedQuestions.filter(
        (q) => q.index !== finalIndex
      );
    }

    await session.save();
    return res.json({ message: "Answer saved" });
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

    const result = await axios.post("http://localhost:5001/check-frame", form, {
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
