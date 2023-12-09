// models/Attendance.js

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming your user model is named "User"
    required: true,
  },
  attendance: [
    {
      date: { type: String, required: true},
      status: { type: String, required: true },
      inTime: { type: String, required: false },
      outTime: { type: String, required: false },
    },
  ],
});

module.exports = mongoose.model("Attendance", attendanceSchema);
