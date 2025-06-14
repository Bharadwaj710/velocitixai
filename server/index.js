const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const AuthRouter = require("./routes/auth");
const collegeRoutes = require("./routes/college");
require("dotenv").config();
require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());
app.use('/admin', require('./routes/admin'));
app.get("/", (req, res) => {
  res.send("Velocitix AI Backend is Running");
});
app.use("/api/college", collegeRoutes);
app.use(bodyParser.json());
app.use("/auth", AuthRouter);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
app.use("/college", collegeRoutes);