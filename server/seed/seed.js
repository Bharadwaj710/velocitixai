require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const College = require("../models/College");
const HR = require("../models/HR");
const Student = require("../models/Student");
const Course = require("../models/Course");
const Progress = require("../models/Progress");

async function seed() {
  await mongoose.connect(process.env.MONGO_CONN);
  console.log("✅ Mongo Connected");

  // 🔥 CLEAN DATABASE (safe for dev)
  await Promise.all([
    User.deleteMany(),
    College.deleteMany(),
    HR.deleteMany(),
    Student.deleteMany(),
    Course.deleteMany(),
    Progress.deleteMany(),
  ]);

  // 🔐 Password
  const hashedPassword = await bcrypt.hash("Password@123", 10);

  // 👤 USERS
  const admin = await User.create({
    name: "Admin",
    email: "admin@velocitix.ai",
    password: hashedPassword,
    role: "admin",
    isAdmin: true,
  });

  const collegeUser = await User.create({
    name: "Vignan Institute",
    email: "college@velocitix.ai",
    password: hashedPassword,
    role: "college",
    collegeSlug: "vignan",
  });

  const hrUser = await User.create({
    name: "HR Manager",
    email: "hr@velocitix.ai",
    password: hashedPassword,
    role: "hr",
  });

  const studentUser = await User.create({
    name: "Student One",
    email: "student@velocitix.ai",
    password: hashedPassword,
    role: "student",
    collegeSlug: "vignan",
  });

  // 🏫 COLLEGE
  const college = await College.create({
    user: collegeUser._id,
    name: "Vignan Institute of Technology",
    slug: "vignan",
    address: { city: "Visakhapatnam", state: "AP", country: "India" },
  });

  // 🧑‍💼 HR
  await HR.create({
    user: hrUser._id,
    company: "Velocitix AI",
    designation: "Hiring Manager",
    experience: 5,
  });

  // 📘 COURSE
  const course = await Course.create({
    title: "AI Interview Mastery",
    description: "Prepare for AI-driven interviews",
    domain: "AI",
    idealRoles: ["ML Engineer", "AI Developer"],
    skillsCovered: ["Python", "ML", "Communication"],
    challengesAddressed: ["Confidence", "Clarity"],
    createdBy: admin._id,
    weeks: [
      {
        weekNumber: 1,
        modules: [
          {
            title: "Foundations",
            lessons: [
              {
                title: "Intro to AI Interviews",
                videoUrl: "https://youtube.com/demo",
              },
            ],
          },
        ],
      },
    ],
  });

  // 🎓 STUDENT
  await Student.create({
    user: studentUser._id,
    name: "Student One",
    course: [course._id],
    college: college.name,
    collegeSlug: "vignan",
    skills: ["Python"],
  });

  // 📊 PROGRESS
  await Progress.create({
    userId: studentUser._id,
    courseId: course._id,
  });

  console.log("🎉 DATABASE SEEDED SUCCESSFULLY");
  process.exit();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
