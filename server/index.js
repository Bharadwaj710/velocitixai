require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const AuthRouter = require("./routes/auth");
const collegeRoutes = require("./routes/college");
require("./config/db");
const hrRoutes = require('./routes/hr');
const app = express();
app.use(cors());
app.use(express.json());
app.use("/admin", require("./routes/admin"));
app.use("/api/users", require("./routes/user"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/students", require("./routes/student"));

app.get("/", (req, res) => {
  res.send("Velocitix AI Backend is Running");
});

app.use("/api/college", collegeRoutes);

const { getOverviewStats } = require("./controller/userController");
app.get("/api/stats/overview", getOverviewStats);

app.use(bodyParser.json());
app.use("/auth", AuthRouter);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use("/college", collegeRoutes);
app.use('/api/hr', hrRoutes);
app.use("/api/college", require("./routes/college"));

require("./models/Student"); // Ensure Student model is registered
require("./models/HR"); // Ensure HR model is registered
require("./models/User"); // Ensure User model is registered
require("./models/Invitation"); // Ensure Invitation model is registered
