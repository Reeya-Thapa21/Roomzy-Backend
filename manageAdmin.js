const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");
require("dotenv").config();

// Get command line arguments
const command = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const name = process.argv[5];

async function manageAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    switch (command) {
      case 'create':
        await createAdmin(email, password, name);
        break;
      case 'list':
        await listAdmins();
        break;
      case 'delete':
        await deleteAdmin(email);
        break;
      case 'reset':
        await resetAdmins();
        break;
      default:
        showHelp();
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

async function createAdmin(email, password, name) {
  if (!email || !password) {
    console.log("❌ Email and password are required!");
    console.log("Usage: node manageAdmin.js create <email> <password> [name]");
    return;
  }

  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    console.log("❌ Admin with this email already exists!");
    console.log(`Email: ${email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const admin = new Admin({
    name: name || "Admin",
    email: email,
    password: hashedPassword,
    role: 'super_admin',
    permissions: {
      hotels: { view: true, create: true, edit: true, delete: true },
      users: { view: true, create: true, edit: true, delete: true },
      bookings: { view: true, create: true, edit: true, delete: true },
      admins: { view: true, create: true, edit: true, delete: true },
      reports: { view: true }
    },
    status: 'active'
  });

  await admin.save();
  
  console.log("✅ Admin created successfully!");
  console.log("==========================================");
  console.log("Name:", admin.name);
  console.log("Email:", admin.email);
  console.log("Password:", password);
  console.log("Role: super_admin");
  console.log("==========================================");
  console.log("\n🚀 Login at: http://localhost:3000/login\n");
}

async function listAdmins() {
  const admins = await Admin.find().select('-password');
  
  if (admins.length === 0) {
    console.log("No admins found.");
    return;
  }

  console.log(`📋 Found ${admins.length} admin(s):\n`);
  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Created: ${admin.createdAt.toLocaleDateString()}`);
    console.log(`   Last Login: ${admin.lastLogin ? admin.lastLogin.toLocaleDateString() : 'Never'}`);
    console.log("");
  });
}

async function deleteAdmin(email) {
  if (!email) {
    console.log("❌ Email is required!");
    console.log("Usage: node manageAdmin.js delete <email>");
    return;
  }

  const admin = await Admin.findOneAndDelete({ email });
  
  if (!admin) {
    console.log(`❌ Admin not found: ${email}`);
    return;
  }

  console.log(`✅ Admin deleted: ${email}`);
}

async function resetAdmins() {
  console.log("⚠️  This will delete ALL admins and create a new super admin!");
  console.log("Resetting in 2 seconds...\n");
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Drop admins collection
  try {
    await mongoose.connection.db.dropCollection('admins');
    console.log("🗑️  Deleted all admins\n");
  } catch (err) {
    console.log("No admins to delete\n");
  }

  // Create default super admin
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = new Admin({
    name: "Riyat Thapa",
    email: "riyathapa231@gmail.com",
    password: hashedPassword,
    role: 'super_admin',
    permissions: {
      hotels: { view: true, create: true, edit: true, delete: true },
      users: { view: true, create: true, edit: true, delete: true },
      bookings: { view: true, create: true, edit: true, delete: true },
      admins: { view: true, create: true, edit: true, delete: true },
      reports: { view: true }
    },
    status: 'active'
  });

  await admin.save();
  
  console.log("✅ Super Admin created!");
  console.log("==========================================");
  console.log("Email: riyathapa231@gmail.com");
  console.log("Password: admin123");
  console.log("==========================================\n");
}

function showHelp() {
  console.log("🔧 Admin Management Tool\n");
  console.log("Usage:");
  console.log("  node manageAdmin.js <command> [options]\n");
  console.log("Commands:");
  console.log("  create <email> <password> [name]  - Create new super admin");
  console.log("  list                               - List all admins");
  console.log("  delete <email>                     - Delete an admin");
  console.log("  reset                              - Reset all admins (creates default)\n");
  console.log("Examples:");
  console.log("  node manageAdmin.js create admin@example.com pass123 'John Doe'");
  console.log("  node manageAdmin.js list");
  console.log("  node manageAdmin.js delete admin@example.com");
  console.log("  node manageAdmin.js reset\n");
}

manageAdmin();
