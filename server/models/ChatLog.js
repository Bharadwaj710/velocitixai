const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
  messages: [
    {
      sender: { type: String, enum: ["user", "bot"], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatLog", ChatLogSchema);
