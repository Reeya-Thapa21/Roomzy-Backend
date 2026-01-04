const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Verify user token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Check if user has hotel owner role
const isHotelOwner = (req, res, next) => {
  if (req.user.role !== 'hotel_owner') {
    return res.status(403).json({ message: "Access denied. Hotel owner role required." });
  }
  next();
};

// Check if hotel owner is verified
const isVerifiedHotelOwner = (req, res, next) => {
  if (req.user.role !== 'hotel_owner') {
    return res.status(403).json({ message: "Access denied. Hotel owner role required." });
  }
  
  if (req.user.hotelOwnerProfile?.verificationStatus !== 'verified') {
    return res.status(403).json({ 
      message: "Your hotel owner account must be verified before accessing this resource." 
    });
  }
  
  next();
};

module.exports = { verifyToken, isHotelOwner, isVerifiedHotelOwner };