const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true},
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '1h' }, // Set expiration time
});

module.exports = mongoose.model('ResetToken', resetTokenSchema);