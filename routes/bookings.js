const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const User = require("../models/user");

// CREATE booking
router.post("/", async (req, res) => {
  try {
    const { userId, hotelId, checkIn, checkOut, guests } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate total price
    const days = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const totalPrice = hotel.price * days;

    const booking = new Booking({
      user: userId,
      hotel: hotelId,
      userName: user.name,
      userEmail: user.email,
      hotelName: hotel.name,
      checkIn,
      checkOut,
      guests: guests || 1,
      totalPrice,
      status: 'pending'
    });

    await booking.save();
    res.json({ success: true, message: "Booking created successfully", booking });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all bookings (Admin)
router.get("/admin/all", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('hotel', 'name location price')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET user bookings
router.get("/user/:userId", async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId })
      .populate('hotel', 'name location price image')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Get user bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE booking status (Admin)
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking status updated", booking });
  } catch (err) {
    console.error("Update booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE booking
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ success: true, message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Delete booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
