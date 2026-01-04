const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const LoginLog = require("../models/LoginLog");

// ADMIN LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      // Log failed attempt
      await LoginLog.create({
        userType: 'Admin',
        email,
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: 'Admin not found'
      });
      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    if (admin.status !== 'active') {
      await LoginLog.create({
        user: admin._id,
        userType: 'Admin',
        email,
        name: admin.name,
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: 'Account not active'
      });
      return res.status(403).json({ message: "Account is not active" });
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      await LoginLog.create({
        user: admin._id,
        userType: 'Admin',
        email,
        name: admin.name,
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: 'Invalid password'
      });
      return res.status(400).json({ message: "Invalid admin credentials" });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Log successful login
    await LoginLog.create({
      user: admin._id,
      userType: 'Admin',
      email,
      name: admin.name,
      ipAddress,
      userAgent,
      status: 'success'
    });

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE ADMIN (Protected - only for initial setup)
router.post("/create", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    admin = new Admin({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      permissions: ['all']
    });

    await admin.save();

    res.json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (err) {
    console.error("Admin creation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
