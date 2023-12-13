const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categories: [{ category: { type: String, required: true } }],
});

module.exports = mongoose.model("LeaveCategory", categorySchema);
