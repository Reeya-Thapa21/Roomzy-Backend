const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'blocked', 'pending'], default: 'active' },
  phone: { type: String }, // General phone field for all users
  role: { 
    type: String, 
    enum: ['user', 'hotel_owner', 'admin', 'support'], 
    default: 'user' 
  },
  hotelOwnerProfile: {
    phone: { type: String },
    businessName: { type: String },
    businessAddress: { type: String },
    businessRegistrationNumber: { type: String },
    taxId: { type: String },
    bankAccountDetails: {
      accountNumber: { type: String },
      routingNumber: { type: String },
      bankName: { type: String },
      accountHolderName: { type: String }
    },
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected'], 
      default: 'pending' 
    },
    documentsSubmitted: { type: Boolean, default: false },
    documentsSubmittedAt: { type: Date },
    documents: [{ type: String }], // File paths
    documentTypes: [{ type: String }], // Document type names
    verificationNotes: { type: String },
    verifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin' 
    },
    verifiedAt: { type: Date },
    rejectionReason: { type: String }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", UserSchema);
