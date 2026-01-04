const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const LoginLog = require("../models/LoginLog");
const { verifyAdmin, checkPermission, isSuperAdmin } = require("../middleware/auth");

// Get all admins (Super Admin only)
router.get("/", verifyAdmin, checkPermission('admins', 'view'), async (req, res) => {
  try {
    const admins = await Admin.find()
      .select('-password')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, admins });
  } catch (err) {
    console.error("Get admins error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new admin (Super Admin only)
router.post("/create", verifyAdmin, checkPermission('admins', 'create'), async (req, res) => {
  try {
    const { name, email, password, role, phone, permissions } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Set default permissions based on role
    let defaultPermissions = getDefaultPermissions(role);
    
    const admin = new Admin({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      permissions: permissions || defaultPermissions,
      createdBy: req.admin._id,
      status: 'active'
    });

    await admin.save();

    res.json({ 
      success: true, 
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update admin
router.put("/:id", verifyAdmin, checkPermission('admins', 'edit'), async (req, res) => {
  try {
    const { name, phone, role, permissions, status } = req.body;

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Only super admin can change roles and permissions
    if (req.admin.role !== 'super_admin' && (role || permissions)) {
      return res.status(403).json({ message: "Only super admin can change roles and permissions" });
    }

    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (role) admin.role = role;
    if (permissions) admin.permissions = permissions;
    if (status) admin.status = status;

    await admin.save();

    res.json({ 
      success: true, 
      message: "Admin updated successfully",
      admin: await Admin.findById(admin._id).select('-password')
    });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete admin (Super Admin only)
router.delete("/:id", verifyAdmin, isSuperAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Prevent deleting yourself
    if (admin._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get admin profile
router.get("/profile/me", verifyAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.json({ success: true, admin });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update own profile
router.put("/profile/me", verifyAdmin, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const admin = await Admin.findById(req.admin._id);
    
    if (name) admin.name = name;
    if (phone) admin.phone = phone;
    if (avatar) admin.avatar = avatar;

    await admin.save();

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      admin: await Admin.findById(admin._id).select('-password')
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/profile/change-password", verifyAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id);
    
    const validPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get login logs
router.get("/logs/login", verifyAdmin, async (req, res) => {
  try {
    const logs = await LoginLog.find()
      .sort({ loginTime: -1 })
      .limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    console.error("Get login logs error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get my login logs
router.get("/logs/my-logins", verifyAdmin, async (req, res) => {
  try {
    const logs = await LoginLog.find({ 
      user: req.admin._id,
      userType: 'Admin'
    })
      .sort({ loginTime: -1 })
      .limit(20);
    res.json({ success: true, logs });
  } catch (err) {
    console.error("Get my login logs error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Helper function to get default permissions
function getDefaultPermissions(role) {
  const permissions = {
    super_admin: {
      hotels: { view: true, create: true, edit: true, delete: true },
      users: { view: true, create: true, edit: true, delete: true },
      bookings: { view: true, create: true, edit: true, delete: true },
      admins: { view: true, create: true, edit: true, delete: true },
      reports: { view: true }
    },
    admin: {
      hotels: { view: true, create: true, edit: true, delete: true },
      users: { view: true, create: false, edit: true, delete: false },
      bookings: { view: true, create: true, edit: true, delete: false },
      admins: { view: false, create: false, edit: false, delete: false },
      reports: { view: true }
    },
    manager: {
      hotels: { view: true, create: true, edit: true, delete: false },
      users: { view: true, create: false, edit: false, delete: false },
      bookings: { view: true, create: true, edit: true, delete: false },
      admins: { view: false, create: false, edit: false, delete: false },
      reports: { view: true }
    },
    support: {
      hotels: { view: true, create: false, edit: false, delete: false },
      users: { view: true, create: false, edit: false, delete: false },
      bookings: { view: true, create: false, edit: true, delete: false },
      admins: { view: false, create: false, edit: false, delete: false },
      reports: { view: false }
    },
    finance: {
      hotels: { view: true, create: false, edit: false, delete: false },
      users: { view: true, create: false, edit: false, delete: false },
      bookings: { view: true, create: false, edit: false, delete: false },
      admins: { view: false, create: false, edit: false, delete: false },
      reports: { view: true }
    },
    hotel_owner: {
      hotels: { view: true, create: true, edit: true, delete: false },
      users: { view: false, create: false, edit: false, delete: false },
      bookings: { view: true, create: false, edit: true, delete: false },
      admins: { view: false, create: false, edit: false, delete: false },
      reports: { view: false }
    }
  };

  return permissions[role] || permissions.support;
}

module.exports = router;
