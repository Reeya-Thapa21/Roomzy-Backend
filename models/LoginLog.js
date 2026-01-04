const mongoose = require("mongoose");

const LoginLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType'
  },
  userType: {
    type: String,
    enum: ['User', 'Admin'],
    required: true
  },
  email: { type: String, required: true },
  name: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  loginTime: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['success', 'failed'], 
    default: 'success' 
  },
  failureReason: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model("LoginLog", LoginLogSchema);
