const express = require("express");
const router = express.Router();
const Hotel = require("../models/Hotel");
const User = require("../models/user");


const calculateDynamicPrice = (roomType, occupancyRate = 0.7, isWeekend = false, isHoliday = false) => {
  let price = roomType.basePrice;
  const rules = roomType.pricingRules;
  
  price *= rules.seasonalMultiplier;
  
  const demandMultiplier = 1 + (occupancyRate - 0.5) * 0.8;
  price *= Math.max(0.8, Math.min(2.0, demandMultiplier));
  
  if (isWeekend) {
    price *= rules.weekendMultiplier;
  }
  
  if (isHoliday) {
    price *= rules.holidayMultiplier;
  }
  
  if (rules.minPrice && price < rules.minPrice) {
    price = rules.minPrice;
  }
  if (rules.maxPrice && price > rules.maxPrice) {
    price = rules.maxPrice;
  }
  
  return Math.round(price * 100) / 100;
};

const updateHotelPricing = async (hotel) => {
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  
  const holidays = [
    '12-25', '01-01', '07-04', '11-28'
  ];
  const currentDate = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isHoliday = holidays.includes(currentDate);
  
  let updated = false;
  
  for (let roomType of hotel.roomTypes) {
    const occupancyRate = (roomType.totalRooms - roomType.availability) / roomType.totalRooms;
    
    const newPrice = calculateDynamicPrice(roomType, occupancyRate, isWeekend, isHoliday);
    
    if (Math.abs(newPrice - roomType.currentPrice) > 1) {
      roomType.currentPrice = newPrice;
      roomType.pricingRules.lastUpdated = now;
      updated = true;
    }
  }
  
  if (updated) {
    hotel.pricingSettings.lastPriceUpdate = now;
    await hotel.save();
  }
  
  return updated;
};


router.get("/", async (req, res) => {
  try {
    const isAdmin = req.headers['admin-access'] === 'true';
    const query = isAdmin ? {} : { status: 'active' };
    const hotels = await Hotel.find(query).sort({ createdAt: -1 });
    
    
    if (!isAdmin) {
      for (let hotel of hotels) {
        if (hotel.pricingSettings?.autoPricingEnabled) {
          await updateHotelPricing(hotel);
        }
      }
    }
    
    res.json({ success: true, hotels });
  } catch (err) {
    console.error("Get hotels error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/pending", async (req, res) => {
  try {
    const pendingHotels = await Hotel.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, hotels: pendingHotels });
  } catch (err) {
    console.error("Get pending hotels error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }
    
    
    if (hotel.pricingSettings?.autoPricingEnabled) {
      await updateHotelPricing(hotel);
    }
    
    res.json({ success: true, hotel });
  } catch (err) {
    console.error("Get hotel error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/", async (req, res) => {
  try {
    const { 
      name, 
      location, 
      description, 
      image, 
      amenities, 
      roomTypes,
      ownerName, 
      ownerEmail, 
      ownerPhone, 
      address, 
      registrationNumber 
    } = req.body;

    // Check if request is from admin
    const isAdminRequest = req.headers['admin-access'] === 'true';
    const adminId = req.headers['admin-id'];

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
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      registrationNumber,
      // All hotels go to pending status for verification
      status: 'pending',
      // Store who created it for reference
      ...(isAdminRequest && {
        createdBy: adminId,
        createdByAdmin: true
      }),
      pricingSettings: {
        autoPricingEnabled: true,
        updateFrequency: 'daily',
        lastPriceUpdate: new Date()
      }
    });

    await hotel.save();
    
    const message = "Hotel registration submitted for verification";
    
    res.json({ success: true, message, hotel });
  } catch (err) {
    console.error("Create hotel error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id/verify", async (req, res) => {
  try {
    const { status, verificationNotes, rejectionReason } = req.body;
    const adminId = req.headers['admin-id'];

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    hotel.status = status;
    hotel.verificationNotes = verificationNotes;
    hotel.verifiedBy = adminId;
    hotel.verifiedAt = new Date();
    
    if (status === 'rejected') {
      hotel.rejectionReason = rejectionReason;
    }

    await hotel.save();
    res.json({ success: true, message: `Hotel ${status} successfully`, hotel });
  } catch (err) {
    console.error("Verify hotel error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




router.put("/:id", async (req, res) => {
  try {
    const { 
      name, 
      location, 
      description, 
      image, 
      amenities, 
      roomTypes,
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      registrationNumber,
      status 
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
      ownerName,
      ownerEmail,
      ownerPhone,
      address,
      registrationNumber
    };

    if (processedRoomTypes) {
      updateData.roomTypes = processedRoomTypes;
    }

    
    if (status) {
      updateData.status = status;
    }

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.json({ success: true, message: "Hotel updated successfully", hotel });
  } catch (err) {
    console.error("Update hotel error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.json({ success: true, message: "Hotel deleted successfully" });
  } catch (err) {
    console.error("Delete hotel error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/admin/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    
    // Initialize hotel owner profile if changing to hotel_owner
    if (role === 'hotel_owner' && !user.hotelOwnerProfile) {
      user.hotelOwnerProfile = {
        verificationStatus: 'pending',
        documentsSubmitted: false
      };
    }
    
    await user.save();

    res.json({ success: true, message: "User role updated successfully", user });
  } catch (err) {
    console.error("Update user role error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Verify hotel owner
router.put("/admin/users/:id/verify-hotel-owner", async (req, res) => {
  try {
    const { verificationStatus, rejectionReason, verificationNotes } = req.body;
    const adminId = req.headers['admin-id'];

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== 'hotel_owner') {
      return res.status(400).json({ message: "User is not a hotel owner" });
    }

    if (!user.hotelOwnerProfile) {
      user.hotelOwnerProfile = {};
    }

    user.hotelOwnerProfile.verificationStatus = verificationStatus;
    user.hotelOwnerProfile.verifiedBy = adminId;
    user.hotelOwnerProfile.verifiedAt = new Date();
    
    if (verificationNotes) {
      user.hotelOwnerProfile.verificationNotes = verificationNotes;
    }
    
    if (verificationStatus === 'rejected') {
      user.hotelOwnerProfile.rejectionReason = rejectionReason;
    } else {
      user.hotelOwnerProfile.rejectionReason = undefined;
    }

    await user.save();

    res.json({ success: true, message: `Hotel owner ${verificationStatus} successfully`, user });
  } catch (err) {
    console.error("Verify hotel owner error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.delete("/admin/users/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id/pricing", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const updated = await updateHotelPricing(hotel);
    
    res.json({ 
      success: true, 
      message: updated ? "Pricing updated successfully" : "No pricing changes needed",
      hotel 
    });
  } catch (err) {
    console.error("Update pricing error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put("/:id/pricing-settings", async (req, res) => {
  try {
    const { autoPricingEnabled, updateFrequency, roomTypeSettings } = req.body;
    
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    
    if (autoPricingEnabled !== undefined) {
      hotel.pricingSettings.autoPricingEnabled = autoPricingEnabled;
    }
    if (updateFrequency) {
      hotel.pricingSettings.updateFrequency = updateFrequency;
    }

    
    if (roomTypeSettings) {
      for (let setting of roomTypeSettings) {
        const roomType = hotel.roomTypes.id(setting.roomTypeId);
        if (roomType && setting.pricingRules) {
          Object.assign(roomType.pricingRules, setting.pricingRules);
        }
      }
    }

    await hotel.save();
    
    res.json({ success: true, message: "Pricing settings updated successfully", hotel });
  } catch (err) {
    console.error("Update pricing settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/:id/pricing-analytics", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const analytics = hotel.roomTypes.map(roomType => {
      const occupancyRate = (roomType.totalRooms - roomType.availability) / roomType.totalRooms;
      const priceChange = ((roomType.currentPrice - roomType.basePrice) / roomType.basePrice * 100).toFixed(1);
      
      return {
        roomTypeName: roomType.name,
        basePrice: roomType.basePrice,
        currentPrice: roomType.currentPrice,
        priceChangePercent: priceChange,
        occupancyRate: (occupancyRate * 100).toFixed(1),
        availability: roomType.availability,
        totalRooms: roomType.totalRooms,
        lastUpdated: roomType.pricingRules.lastUpdated
      };
    });

    res.json({ success: true, analytics });
  } catch (err) {
    console.error("Get pricing analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Test endpoint - simple hotel creation without any checks
router.post("/test-create", async (req, res) => {
  try {
    const { name, location, ownerEmail } = req.body;

    const hotel = new Hotel({
      name: name || "Test Hotel",
      location: location || "Test Location", 
      description: "Test hotel created without verification",
      ownerName: "Test Owner",
      ownerEmail: ownerEmail || "test@example.com",
      ownerPhone: "123-456-7890",
      status: 'pending',
      roomTypes: [{
        name: "Standard Room",
        basePrice: 100,
        currentPrice: 100,
        capacity: 2,
        availability: 10,
        totalRooms: 10,
        amenities: [],
        description: "Test room",
        pricingRules: {
          seasonalMultiplier: 1.0,
          demandMultiplier: 1.0,
          weekendMultiplier: 1.2,
          holidayMultiplier: 1.5,
          minPrice: 70,
          maxPrice: 200,
          lastUpdated: new Date()
        }
      }],
      amenities: [],
      pricingSettings: {
        autoPricingEnabled: true,
        updateFrequency: 'daily',
        lastPriceUpdate: new Date()
      }
    });

    await hotel.save();
    
    res.json({ 
      success: true, 
      message: "Test hotel created successfully without any verification checks",
      hotel 
    });
  } catch (err) {
    console.error("Test create hotel error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create new user (Admin only)
router.post("/admin/users/create", async (req, res) => {
  try {
    const { name, email, password, role, hotelOwnerProfile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user object
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
      authProvider: 'local',
      isVerified: true, // Admin-created users are auto-verified
      createdAt: new Date()
    };

    // Add hotel owner profile if role is hotel_owner
    if (role === 'hotel_owner' && hotelOwnerProfile) {
      userData.hotelOwnerProfile = {
        ...hotelOwnerProfile,
        verificationStatus: hotelOwnerProfile.verificationStatus || 'pending',
        documentsSubmitted: hotelOwnerProfile.documentsSubmitted || false
      };
    }

    const newUser = new User(userData);
    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({ 
      success: true, 
      message: "User created successfully", 
      user: userResponse 
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (Admin only)
router.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user status (Admin only)
router.put("/admin/users/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, message: "User status updated", user });
  } catch (err) {
    console.error("Update user status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user (Admin only)
router.delete("/admin/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
