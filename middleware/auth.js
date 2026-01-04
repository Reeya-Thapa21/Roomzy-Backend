const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Verify admin token
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({ message: "Account is not active" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Check specific permission
const checkPermission = (resource, action) => {
  return (req, res, next) => {
    const admin = req.admin;

    // Super admin has all permissions
    if (admin.role === 'super_admin') {
      return next();
    }

    // Check if admin has the specific permission
    if (admin.permissions[resource] && admin.permissions[resource][action]) {
      return next();
    }

    return res.status(403).json({ 
      message: `You don't have permission to ${action} ${resource}` 
    });
  };
};

// Check if super admin
const isSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ message: "Only super admin can perform this action" });
  }
  next();
};

module.exports = { verifyAdmin, checkPermission, isSuperAdmin };
