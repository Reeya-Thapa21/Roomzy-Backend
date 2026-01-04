const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Admin = require("./models/Admin");
const User = require("./models/user");
const Hotel = require("./models/Hotel");
const Booking = require("./models/Booking");
const LoginLog = require("./models/LoginLog");

async function viewDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");
    console.log("==========================================");
    console.log("DATABASE: hotel-booking");
    console.log("==========================================\n");

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📁 COLLECTIONS IN DATABASE:");
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    console.log("\n==========================================\n");

    // Admins
    const admins = await Admin.find().select('-password');
    console.log(`👤 ADMINS (${admins.length} total):`);
    admins.forEach(admin => {
      console.log(`\n  ID: ${admin._id}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Role: ${admin.role}`);
      console.log(`  Status: ${admin.status}`);
      console.log(`  Created: ${admin.createdAt}`);
      console.log(`  Last Login: ${admin.lastLogin || 'Never'}`);
    });
    console.log("\n==========================================\n");

    // Users
    const users = await User.find().select('-password');
    console.log(`👥 USERS (${users.length} total):`);
    users.forEach(user => {
      console.log(`\n  ID: ${user._id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Auth Provider: ${user.authProvider}`);
      console.log(`  Created: ${user.createdAt}`);
    });
    console.log("\n==========================================\n");

    // Hotels
    const hotels = await Hotel.find();
    console.log(`🏨 HOTELS (${hotels.length} total):`);
    hotels.forEach(hotel => {
      console.log(`\n  ID: ${hotel._id}`);
      console.log(`  Name: ${hotel.name}`);
      console.log(`  Location: ${hotel.location}`);
      console.log(`  Price: $${hotel.price}/night`);
      console.log(`  Rating: ${hotel.rating}`);
      console.log(`  Status: ${hotel.status}`);
    });
    console.log("\n==========================================\n");

    // Bookings
    const bookings = await Booking.find()
      .populate('user', 'name email')
      .populate('hotel', 'name location');
    console.log(`📅 BOOKINGS (${bookings.length} total):`);
    bookings.forEach(booking => {
      console.log(`\n  ID: ${booking._id}`);
      console.log(`  User: ${booking.userName} (${booking.userEmail})`);
      console.log(`  Hotel: ${booking.hotelName}`);
      console.log(`  Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`);
      console.log(`  Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`);
      console.log(`  Total: $${booking.totalPrice}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Created: ${booking.createdAt}`);
    });
    console.log("\n==========================================\n");

    // Login Logs
    const logs = await LoginLog.find().sort({ loginTime: -1 }).limit(10);
    console.log(`🔐 RECENT LOGIN LOGS (Last 10):`);
    logs.forEach(log => {
      console.log(`\n  ${log.status === 'success' ? '✅' : '❌'} ${log.email}`);
      console.log(`  Time: ${new Date(log.loginTime).toLocaleString()}`);
      console.log(`  IP: ${log.ipAddress}`);
      console.log(`  Status: ${log.status}`);
      if (log.failureReason) {
        console.log(`  Reason: ${log.failureReason}`);
      }
    });
    console.log("\n==========================================\n");

    // Summary
    console.log("📊 DATABASE SUMMARY:");
    console.log(`  Total Admins: ${admins.length}`);
    console.log(`  Total Users: ${users.length}`);
    console.log(`  Total Hotels: ${hotels.length}`);
    console.log(`  Total Bookings: ${bookings.length}`);
    console.log(`  Total Login Logs: ${await LoginLog.countDocuments()}`);
    console.log("\n==========================================");
    
    console.log("\n🌐 ACCESS YOUR DATABASE:");
    console.log("  MongoDB Atlas: https://cloud.mongodb.com/");
    console.log("  Database Name: hotel-booking");
    console.log("  Collections: admins, users, hotels, bookings, loginlogs");
    console.log("\n==========================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

viewDatabase();
