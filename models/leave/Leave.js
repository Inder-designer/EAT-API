const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming your user model is named "User"
      required: true,
    },
    leaves: [
      {
        userName: {
          type: mongoose.Schema.Types.String,
          ref: "User", // Assuming your user model is named "User"
          required: true,
        },
        compensatory: { type: Boolean, default: false },
        date: { type: String, required: true },
        category: { type: String, required: true },
        reason: { type: String, required: true },
        upto: { type: String },
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
      },
      { timestamps: true }
    ],
  },
);

module.exports = mongoose.model("Leave", leaveSchema);
