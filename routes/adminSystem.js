const express = require("express");
const router = express.Router();
const Hotel = require("../models/Hotel");
const User = require("../models/user");
const Booking = require("../models/Booking");
const { verifyAdmin } = require("../middleware/auth");

// Payment Management Routes
router.get("/payments", verifyAdmin, async (req, res) => {
  try {
    // Mock payment data - replace with actual payment model
    const payments = [
      {
        _id: "payment_001",
        userName: "John Doe",
        bookingId: "booking_001",
        amount: 250.00,
        method: "credit_card",
        status: "completed",
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        _id: "payment_002",
        userName: "Jane Smith",
        bookingId: "booking_002",
        amount: 180.00,
        method: "paypal",
        status: "pending",
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        _id: "payment_003",
        userName: "Bob Johnson",
        bookingId: "booking_003",
        amount: 320.00,
        method: "credit_card",
        status: "failed",
        createdAt: new Date(Date.now() - 7200000) // 2 hours ago
      }
    ];

    res.json({ success: true, payments });
  } catch (err) {
    console.error("Get payments error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update payment status
router.put("/payments/:id/:action", verifyAdmin, async (req, res) => {
  try {
    const { id, action } = req.params;
    
    // Mock payment update - replace with actual payment model update
    console.log(`Payment ${id} ${action}d by admin`);
    
    res.json({ success: true, message: `Payment ${action}d successfully` });
  } catch (err) {
    console.error("Update payment error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Room availability management
router.get("/room-availability", verifyAdmin, async (req, res) => {
  try {
    const hotels = await Hotel.find({ status: 'active' });
    
    const availability = hotels.map(hotel => ({
      hotelId: hotel._id,
      hotelName: hotel.name,
      location: hotel.location,
      roomTypes: hotel.roomTypes.map(room => ({
        name: room.name,
        available: room.availability,
        total: room.totalRooms,
        booked: room.totalRooms - room.availability,
        occupancyRate: ((room.totalRooms - room.availability) / room.totalRooms * 100).toFixed(1)
      }))
    }));

    res.json({ success: true, availability });
  } catch (err) {
    console.error("Get room availability error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update room availability
router.put("/hotels/:hotelId/rooms/:roomIndex/availability", verifyAdmin, async (req, res) => {
  try {
    const { hotelId, roomIndex } = req.params;
    const { availability } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (roomIndex >= hotel.roomTypes.length) {
      return res.status(404).json({ message: "Room type not found" });
    }

    hotel.roomTypes[roomIndex].availability = availability;
    await hotel.save();

    res.json({ success: true, message: "Room availability updated successfully" });
  } catch (err) {
    console.error("Update room availability error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete room type
router.delete("/hotels/:hotelId/rooms/:roomIndex", verifyAdmin, async (req, res) => {
  try {
    const { hotelId, roomIndex } = req.params;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    if (roomIndex >= hotel.roomTypes.length) {
      return res.status(404).json({ message: "Room type not found" });
    }

    hotel.roomTypes.splice(roomIndex, 1);
    await hotel.save();

    res.json({ success: true, message: "Room type deleted successfully" });
  } catch (err) {
    console.error("Delete room type error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Add new room type to hotel
router.post("/hotels/:hotelId/rooms", verifyAdmin, async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { name, basePrice, capacity, totalRooms, amenities, description } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const newRoom = {
      name,
      basePrice: parseFloat(basePrice),
      currentPrice: parseFloat(basePrice),
      capacity: parseInt(capacity),
      amenities: amenities || [],
      availability: parseInt(totalRooms),
      totalRooms: parseInt(totalRooms),
      description: description || '',
      pricingRules: {
        seasonalMultiplier: 1.0,
        demandMultiplier: 1.0,
        weekendMultiplier: 1.2,
        holidayMultiplier: 1.5,
        minPrice: parseFloat(basePrice) * 0.7,
        maxPrice: parseFloat(basePrice) * 2.0,
        lastUpdated: new Date()
      }
    };

    hotel.roomTypes.push(newRoom);
    await hotel.save();

    res.json({ success: true, message: "Room type added successfully", room: newRoom });
  } catch (err) {
    console.error("Add room type error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// System analytics
router.get("/analytics", verifyAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHotels = await Hotel.countDocuments();
    const activeHotels = await Hotel.countDocuments({ status: 'active' });
    const pendingHotels = await Hotel.countDocuments({ status: 'pending' });
    
    // Mock booking data - replace with actual booking model
    const totalBookings = 150;
    const totalRevenue = 45000;
    
    const analytics = {
      users: {
        total: totalUsers,
        regular: await User.countDocuments({ role: 'user' }),
        hotelOwners: await User.countDocuments({ role: 'hotel_owner' }),
        growth: '+8.2%'
      },
      hotels: {
        total: totalHotels,
        active: activeHotels,
        pending: pendingHotels,
        rejected: await Hotel.countDocuments({ status: 'rejected' })
      },
      bookings: {
        total: totalBookings,
        thisMonth: 45,
        revenue: totalRevenue,
        averageValue: totalRevenue / totalBookings
      },
      occupancy: {
        average: 78.3,
        trend: '+5.1%'
      }
    };

    res.json({ success: true, analytics });
  } catch (err) {
    console.error("Get analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// System security logs
router.get("/security/logs", verifyAdmin, async (req, res) => {
  try {
    // Mock security logs - replace with actual logging system
    const logs = [
      {
        timestamp: new Date(),
        event: "Admin Login",
        user: req.admin.email,
        ip: req.ip,
        status: "success"
      },
      {
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        event: "Hotel Verification",
        user: req.admin.email,
        ip: req.ip,
        status: "action"
      },
      {
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        event: "User Registration",
        user: "user@example.com",
        ip: "192.168.1.100",
        status: "success"
      }
    ];

    res.json({ success: true, logs });
  } catch (err) {
    console.error("Get security logs error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// System settings
router.get("/settings", verifyAdmin, async (req, res) => {
  try {
    // Mock system settings - replace with actual settings model
    const settings = {
      platform: {
        name: "Roomzy",
        currency: "USD",
        timezone: "UTC",
        allowRegistrations: true,
        emailNotifications: true
      },
      business: {
        commissionRate: 10,
        cancellationWindow: 24,
        autoVerification: "manual",
        dynamicPricing: true,
        maintenanceMode: false
      },
      security: {
        twoFactorRequired: true,
        loginMonitoring: true,
        autoBackups: true,
        ipWhitelist: false
      }
    };

    res.json({ success: true, settings });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update system settings
router.put("/settings", verifyAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    
    // Mock settings update - replace with actual settings model update
    console.log("Settings updated by admin:", req.admin.email, settings);
    
    res.json({ success: true, message: "Settings updated successfully" });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// System actions
router.post("/actions/:action", verifyAdmin, async (req, res) => {
  try {
    const { action } = req.params;
    
    switch (action) {
      case 'backup':
        // Implement database backup
        console.log("Database backup initiated by:", req.admin.email);
        break;
      case 'clear-cache':
        // Implement cache clearing
        console.log("Cache cleared by:", req.admin.email);
        break;
      case 'update-prices':
        // Update all hotel prices
        const hotels = await Hotel.find({ status: 'active' });
        for (let hotel of hotels) {
          if (hotel.pricingSettings?.autoPricingEnabled) {
            // Update pricing logic here
            console.log(`Updating prices for hotel: ${hotel.name}`);
          }
        }
        break;
      case 'restart':
        // System restart (be careful with this!)
        console.log("System restart requested by:", req.admin.email);
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }
    
    res.json({ success: true, message: `${action} completed successfully` });
  } catch (err) {
    console.error(`System action ${req.params.action} error:`, err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;