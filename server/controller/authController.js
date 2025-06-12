const bcrypt = require("bcrypt");
const UserModel = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      isAdmin = false,
      role = "student",
    } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists, you can login",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      isAdmin,
      role,
    });

    await user.save();

    res.status(201).json({
      message: "Signup successful",
      success: true,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Debug log
    console.log('Login attempt for:', email);
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
        success: false
      });
    }

    console.log('User found:', {
      id: user._id,
      name: user.name,
      isAdmin: user.isAdmin
    });

    // Create token with proper user data
    const token = jwt.sign({
  userId: user._id,
  isAdmin: user.isAdmin,
  role: user.role,
  collegeSlug: user.collegeSlug || null  // 🔥 include this
}, process.env.JWT_SECRET, { expiresIn: "24h" });

    // Send response with explicit boolean conversion
  res.status(200).json({
  message: "Login successful",
  success: true,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    role: user.role,
    collegeSlug: user.collegeSlug || null   // 🔥 include this
  },
  token
});

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// forgot password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your gmail
        pass: process.env.EMAIL_PASS, // app password from google
      },
    });
    
    await transporter.sendMail({
      from: `"Velocitix AI" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
    });

    res.json({ message: "Reset link sent to your email", success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Something went wrong", success: false });
  }
};

// reset password
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded.id);
    
    // Check if the new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: "New password cannot be the same as the old password", 
        success: false 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserModel.findByIdAndUpdate(decoded.id, { password: hashedPassword });

    res.json({ message: "Password reset successful", success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Invalid or expired token", success: false });
  }
};

// Google login
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await UserModel.findOne({ email });

    if (!user) {
      user = new UserModel({
        name,
        email,
        password: "google-auth", // placeholder
        role: "student"
      });
      await user.save();
    }

    const jwtToken = jwt.sign({
      _id: user._id,
      email: user.email,
      role: user.role
    }, process.env.JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({
      message: "Google login successful",
      success: true,
      jwtToken,
      user
    });
  } catch (err) {
    console.error("Google Login Error:", err);
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// google signup
const googleSignup = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    let existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please login instead."
      });
    }

    const newUser = new UserModel({
      name,
      email,
      password: "google-auth", // optional placeholder
      role: "student"
    });

    await newUser.save();

    const jwtToken = jwt.sign(
      { _id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      message: "Google sign up successful",
      jwtToken,
      user: newUser
    });
  } catch (err) {
    console.error("Google Signup Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleSignup,
};
