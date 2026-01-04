const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/user");
const Hotel = require("../models/Hotel");
const { verifyToken } = require("../middleware/userAuth");

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

// Hotel Owner Registration
router.post("/register", async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone,
      businessName,
      businessAddress,
      businessRegistrationNumber,
      taxId,
      bankAccountDetails
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with hotel_owner role
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'hotel_owner',
      authProvider: 'local',
      hotelOwnerProfile: {
        phone,
        businessName,
        businessAddress,
        businessRegistrationNumber,
        taxId,
        bankAccountDetails,
        verificationStatus: 'pending',
        documentsSubmitted: false
      }
    });

    await user.save();

    res.json({ 
      success: true, 
      message: "Hotel owner registration successful. Please complete your profile and submit required documents.",
      userId: user._id
    });
  } catch (err) {
    console.error("Hotel owner registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Hotel Owner Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'hotel_owner' });
    if (!user) {
      return res.status(400).json({ message: "Hotel owner account not found" });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({ message: "Please login with Google" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hotelOwnerProfile: user.hotelOwnerProfile
      }
    });
  } catch (err) {
    console.error("Hotel owner login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Hotel Owner Profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hotel_owner') {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, profile: user });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update Hotel Owner Profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hotel_owner') {
      return res.status(403).json({ message: "Access denied" });
    }

    const { 
      name, 
      phone,
      businessName,
      businessAddress,
      businessRegistrationNumber,
      taxId,
      bankAccountDetails
    } = req.body;

    const user = await User.findById(req.user.id);
    
    if (name) user.name = name;
    if (phone) user.hotelOwnerProfile.phone = phone;
    if (businessName) user.hotelOwnerProfile.businessName = businessName;
    if (businessAddress) user.hotelOwnerProfile.businessAddress = businessAddress;
    if (businessRegistrationNumber) user.hotelOwnerProfile.businessRegistrationNumber = businessRegistrationNumber;
    if (taxId) user.hotelOwnerProfile.taxId = taxId;
    if (bankAccountDetails) user.hotelOwnerProfile.bankAccountDetails = bankAccountDetails;

    await user.save();

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      profile: user
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit Documents for Verification
router.post("/documents", upload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'taxCertificate', maxCount: 1 },
  { name: 'identityProof', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId } = req.body;
    let user;
    
    // If userId is provided (from registration), find user by ID
    // Otherwise, use token verification for authenticated requests
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    } else {
      // Verify token for authenticated requests
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findById(decoded.id);
      
      if (!user || user.role !== 'hotel_owner') {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const documentPaths = [];
    const documentTypes = [];

    // Process uploaded files
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        const file = req.files[fieldName][0];
        documentPaths.push(file.path);
        documentTypes.push(fieldName);
      });
    }

    // Update user's document information
    if (!user.hotelOwnerProfile) {
      user.hotelOwnerProfile = {};
    }

    user.hotelOwnerProfile.documents = documentPaths;
    user.hotelOwnerProfile.documentTypes = documentTypes;
    user.hotelOwnerProfile.documentsSubmitted = documentPaths.length > 0;
    user.hotelOwnerProfile.documentsSubmittedAt = new Date();

    await user.save();

    res.json({ 
      success: true, 
      message: "Documents submitted successfully. Your account will be reviewed within 2-3 business days.",
      documentsUploaded: documentTypes
    });
  } catch (err) {
    console.error("Submit documents error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get My Hotels
router.get("/hotels", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hotel_owner') {
      return res.status(403).json({ message: "Access denied" });
    }

    const hotels = await Hotel.find({ ownerEmail: req.user.email })
      .sort({ createdAt: -1 });

    res.json({ success: true, hotels });
  } catch (err) {
    console.error("Get my hotels error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Register New Hotel
router.post("/hotels", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hotel_owner') {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(req.user.id);

    const { 
      name, 
      location, 
      description, 
      image, 
      amenities, 
      roomTypes,
      address, 
      registrationNumber,
      documents
    } = req.body;

    const processedRoomTypes = (roomTypes || []).map(room => {
      const basePrice = parseFloat(room.basePrice || room.price || 0);
      return {
        name: room.name,
        basePrice: basePrice,
        currentPrice: parseFloat(room.currentPrice || basePrice),
        capacity: parseInt(room.capacity || 2),
        amenities: room.amenities || [],
        availability: parseInt(room.availability || 1),
        totalRooms: parseInt(room.totalRooms || room.availability || 1),
        description: room.description || '',
        pricingRules: {
          seasonalMultiplier: 1.0,
          demandMultiplier: 1.0,
          weekendMultiplier: 1.2,
          holidayMultiplier: 1.5,
          minPrice: basePrice * 0.7,
          maxPrice: basePrice * 2.0,
          lastUpdated: new Date()
        }
      };
    });

    const hotel = new Hotel({
      name,
      location,
      description,
      image,
      amenities: amenities || [],
      roomTypes: processedRoomTypes,
      ownerName: user.name,
      ownerEmail: user.email,
      ownerPhone: user.hotelOwnerProfile?.phone,
      address,
      registrationNumber,
      documents: documents || [],
      status: 'pending',
      ownerId: user._id,
      pricingSettings: {
        autoPricingEnabled: true,
        updateFrequency: 'daily',
        lastPriceUpdate: new Date()
      }
    });

    await hotel.save();

    res.json({ 
      success: true, 
      message: "Hotel registration submitted for verification", 
      hotel 
    });
  } catch (err) {
    console.error("Register hotel error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update My Hotel
router.put("/hotels/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hotel_owner') {
      return res.status(403).json({ message: "Access denied" });
    }

    const hotel = await Hotel.findOne({ 
      _id: req.params.id, 
      ownerEmail: req.user.email 
    });

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or access denied" });
    }

    const { 
      name, 
      location, 
      description, 
      image, 
      amenities, 
      roomTypes,
      address, 
      registrationNumber
    } = req.body;

    const processedRoomTypes = roomTypes ? roomTypes.map(room => {
      const basePrice = parseFloat(room.basePrice || room.price || 0);
      return {
        name: room.name,
        basePrice: basePrice,
        currentPrice: parseFloat(room.currentPrice || basePrice),
        capacity: parseInt(room.capacity || 2),
        amenities: room.amenities || [],
        availability: parseInt(room.availability || 1),
        totalRooms: parseInt(room.totalRooms || room.availability || 1),
        description: room.description || '',
        pricingRules: room.pricingRules || {
          seasonalMultiplier: 1.0,
          demandMultiplier: 1.0,
          weekendMultiplier: 1.2,
          holidayMultiplier: 1.5,
          minPrice: basePrice * 0.7,
          maxPrice: basePrice * 2.0,
          lastUpdated: new Date()
        }
      };
    }) : undefined;

    const updateData = {
      name, 
      location, 
      description, 
      image, 
      amenities, 
      address,
      registrationNumber
    };

    if (processedRoomTypes) {
      updateData.roomTypes = processedRoomTypes;
    }

    // If hotel was rejected, reset to pending when updated
    if (hotel.status === 'rejected') {
      updateData.status = 'pending';
      updateData.rejectionReason = undefined;
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ 
      success: true, 
      message: "Hotel updated successfully", 
      hotel: updatedHotel 
    });
  } catch (err) {
    console.error("Update hotel error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Hotel Analytics
router.get("/hotels/:id/analytics", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'hotel_owner') {
      return res.status(403).json({ message: "Access denied" });
    }

    const hotel = await Hotel.findOne({ 
      _id: req.params.id, 
      ownerEmail: req.user.email 
    });

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found or access denied" });
    }

    // Get booking analytics (you'll need to implement this based on your booking system)
    const analytics = {
      totalRooms: hotel.roomTypes.reduce((sum, room) => sum + room.totalRooms, 0),
      availableRooms: hotel.roomTypes.reduce((sum, room) => sum + room.availability, 0),
      occupancyRate: 0, // Calculate based on bookings
      averagePrice: hotel.roomTypes.reduce((sum, room) => sum + room.currentPrice, 0) / hotel.roomTypes.length,
      revenue: 0, // Calculate based on bookings
      roomTypes: hotel.roomTypes.map(room => ({
        name: room.name,
        totalRooms: room.totalRooms,
        availability: room.availability,
        occupancyRate: ((room.totalRooms - room.availability) / room.totalRooms * 100).toFixed(1),
        currentPrice: room.currentPrice,
        basePrice: room.basePrice
      }))
    };

    analytics.occupancyRate = ((analytics.totalRooms - analytics.availableRooms) / analytics.totalRooms * 100).toFixed(1);

    res.json({ success: true, analytics });
  } catch (err) {
    console.error("Get hotel analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get uploaded document (admin only)
router.get("/documents/:filename", verifyToken, async (req, res) => {
  try {
    // Only allow admins or the document owner to access documents
    if (req.user.role !== 'hotel_owner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied" });
    }

    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/documents', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Document not found" });
    }

    // For hotel owners, verify they own the document
    if (req.user.role === 'hotel_owner') {
      const user = await User.findById(req.user.id);
      if (!user.hotelOwnerProfile?.documents?.includes(filePath)) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error("Get document error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;