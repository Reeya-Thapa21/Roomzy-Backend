const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({ name, email, password: hashedPassword, authProvider: 'local' });
    await user.save();

    res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User does not exist" });

    if (user.authProvider === 'google') {
      return res.status(400).json({ message: "Please login with Google" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ message: "Incorrect password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        hotelOwnerProfile: user.hotelOwnerProfile
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GOOGLE LOGIN
router.post("/google", async (req, res) => {
  const { credential } = req.body;

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        picture,
        authProvider: 'google'
      });
      await user.save();
    } else if (!user.googleId) {
      // Update existing user with Google info
      user.googleId = googleId;
      user.picture = picture;
      user.authProvider = 'google';
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        hotelOwnerProfile: user.hotelOwnerProfile
      }
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

module.exports = router;
