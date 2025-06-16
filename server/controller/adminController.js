const User = require('../models/User');
const HR = require('../models/HR');
const Student = require('../models/Student');
const College = require('../models/College');
const bcrypt = require('bcrypt');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const Course = require('../models/Course');
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
    const users = await User.find({ role: 'student' }).lean();
    const userIds = users.map(u => u._id);

    const studentInfo = await Student.find({ user: { $in: userIds } })
      .populate('course', 'title') // title from course collection
      .lean();

    const merged = users.map(user => {
      const student = studentInfo.find(std => std.user.toString() === user._id.toString());

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        course: student?.course?.title || 'Not updated',
        courseId: student?.course?._id?.toString() || '',
        branch: student?.branch || 'Not updated',
        yearOfStudy: student?.yearOfStudy || 'Not updated',
        college: student?.college || 'Not updated',
        phoneNumber: student?.phoneNumber || 'Not provided',
        skills: student?.skills || [],
        scorecard: student?.scorecard
      };
    });

    res.status(200).json(merged);
  } catch (err) {
    console.error("Fetch Students Failed:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const getHiredStudents = async (req, res) => {
  try {
    const students = await Student.find({ 'hired.isHired': true })
      .populate('user', 'name email')
      .populate('course', 'title')
      .lean();

    const result = students.map(s => ({
      id: s._id,
      name: s.user.name,
      email: s.user.email,
      college: s.college,
      course: s.course?.title || 'Not updated',
      courseId: s.course?._id?.toString() || '',
      companyName: s.hired?.companyName || '',
      hiredDate: s.hired?.hiredDate
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Fetch Hired Students Failed:", err);
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
// 4. Get unique filter options for Students
const getStudentFilters = async (req, res) => {
  try {
    const rawCourseIds = await Student.distinct('course');

    // Filter out invalid ObjectIds
    const validCourseIds = rawCourseIds.filter(id =>
      mongoose.Types.ObjectId.isValid(id?.toString?.())
    );

    const courses = await Course.find({ _id: { $in: validCourseIds } })
      .select('title')
      .lean();

    const colleges = await Student.distinct('college', { college: { $ne: null } });
    const validColleges = colleges.filter(c => typeof c === 'string' && c.trim() !== '');

    res.status(200).json({
      courses: courses.map(c => ({ _id: c._id.toString(), title: c.title })),
      colleges: validColleges
    });
  } catch (err) {
    console.error("Fetch Student Filters Failed:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// 5. Get unique filter options for HRs
const getHRFilters = async (req, res) => {
  try {
    const companies = await HR.distinct('company', { company: { $ne: null } });

    res.status(200).json({
      companies: companies.filter(c => c && c.trim() !== '')
    });
  } catch (err) {
    console.error("Fetch HR Filters Failed:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
const getAdminProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, email, phone, bio, password } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (bio) user.bio = bio;

    if (req.file) {
      user.imageUrl = `/uploads/${req.file.filename}`;
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    const updatedUser = await User.findById(userId).select('-password');
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

const deleteAdminProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete account' });
  }
};
const getRecentNotifications = async (req, res) => {
  try {
    const recent = await Notification.find().sort({ createdAt: -1 }).limit(5);
    res.status(200).json(recent);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// Get all notifications (for Recent Activity page)
const getAllNotifications = async (req, res) => {
  try {
    const all = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(all);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all notifications' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.status(200).json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update' });
  }
};

module.exports = {
  getAllUsers,
  getAllStudents,
  getHiredStudents,
  getAllColleges: getAllPartnerColleges,
  getAllHRs,
  getStudentFilters,
  getHRFilters,
  getAdminProfile,
  updateAdminProfile, deleteAdminProfile,getRecentNotifications,getAllNotifications,markAsRead
};

