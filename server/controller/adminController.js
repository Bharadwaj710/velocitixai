const User = require('../models/User');
const HR = require('../models/HR');
const Student = require('../models/Student');
const College = require('../models/College');

// 1. Get ALL users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("college", "name");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// 2. Get ONLY Students
const getAllStudents = async (req, res) => {
  try {
    // Get users with student role
    const users = await User.find({ role: 'student' }).lean();
    const userIds = users.map(u => u._id);

    // Get matching student info
    const studentInfo = await Student.find({ user: { $in: userIds } }).lean();

    // Merge user and student info
    const merged = users.map(user => {
      const student = studentInfo.find(std => std.user.toString() === user._id.toString());

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        course: student?.course || 'Not updated',
        branch: student?.branch || 'Not updated',
        yearOfStudy: student?.yearOfStudy || 'Not updated',
        college: student?.college || 'Not updated',
        phoneNumber: student?.phoneNumber || 'Not provided',
        skills: student?.skills || []
      };
    });
    
    res.status(200).json(merged);
  } catch (err) {
    console.error("Fetch Students Failed:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// 3. Get Colleges
const getAllPartnerColleges = async (req, res) => {
  try {
    // 1. Get all users with role 'college'
    const collegeUsers = await User.find({ role: 'college' }).lean();
    const userIds = collegeUsers.map(u => u._id);

    // 2. Get all college documents linked to these users
    const collegeInfo = await College.find({ user: { $in: userIds } }).lean();

    // 3. Merge data
    const merged = collegeUsers.map(user => {
      const college = collegeInfo.find(c => c.user.toString() === user._id.toString());

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: college?.status || 'Not Updated',
        establishedYear: college?.establishedYear || 'N/A',
        accreditation: college?.accreditation || 'N/A',
        courses: college?.courses || [],
        contact: college?.contact || null
      };
    });

    res.status(200).json(merged);
  } catch (err) {
    console.error("Fetch Partner Colleges Failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAllHRs = async (req, res) => {
  try {
    const hrUsers = await User.find({ role: 'hr' }).lean();
    const userIds = hrUsers.map(u => u._id);

    const hrDetails = await HR.find({ user: { $in: userIds } }).lean();

    const merged = hrUsers.map(user => {
      const hr = hrDetails.find(h => h.user.toString() === user._id.toString());

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: hr?.company || 'Not updated',
        designation: hr?.designation || 'Not updated',
        experience: hr?.experience || 'Not updated',
        phoneNumber: hr?.phoneNumber || 'Not provided',
        address: hr?.address || 'Not provided'
      };
    });

    res.status(200).json(merged);
  } catch (err) {
    console.error("Fetch HRs Failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getAllUsers,getAllStudents, getAllColleges:getAllPartnerColleges,getAllHRs };
