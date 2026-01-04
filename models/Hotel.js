const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  amenities: [{ type: String }],
  rating: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'inactive', 'rejected'], 
    default: 'pending' 
  },
  roomTypes: [{
    name: { type: String, required: true },
    basePrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    capacity: { type: Number, default: 2 },
    amenities: [{ type: String }],
    availability: { type: Number, default: 10 },
    totalRooms: { type: Number, default: 10 },
    description: { type: String },
    pricingRules: {
      seasonalMultiplier: { type: Number, default: 1.0 },
      demandMultiplier: { type: Number, default: 1.0 },
      weekendMultiplier: { type: Number, default: 1.2 },
      holidayMultiplier: { type: Number, default: 1.5 },
      minPrice: { type: Number },
      maxPrice: { type: Number },
      lastUpdated: { type: Date, default: Date.now }
    }
  }],
  pricingSettings: {
    autoPricingEnabled: { type: Boolean, default: true },
    updateFrequency: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
    lastPriceUpdate: { type: Date, default: Date.now }
  },
  ownerName: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  ownerPhone: { type: String, required: true },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  address: { type: String, required: true },
  registrationNumber: { type: String },
  documents: [{ type: String }],
  verificationNotes: { type: String },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin' 
  },
  verifiedAt: { type: Date },
  rejectionReason: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model("Hotel", HotelSchema);
