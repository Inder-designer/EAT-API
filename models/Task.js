const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming your user model is named "User"
    required: true,
  },
  task: [
    {
      date: { type: String, required: true },
      tasks : [
        {
          description: { type: String, required: true },
          deadline: { type: String, required: true },
          status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
        }
      ]
    },
  ],
});

module.exports = mongoose.model("Task", taskSchema);