const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Bearer token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authorization token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach minimal user info
    req.user = {
      id: decoded.userId || decoded.id, // depending on how you signed the token
      role: decoded.role,
      isAdmin: decoded.isAdmin || false,
    };

    next(); // continue to controller
  } catch (err) {
    console.error("JWT Verification Failed:", err.message);
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token" });
  }
};

module.exports = auth;
