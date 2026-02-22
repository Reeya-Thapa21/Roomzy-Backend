require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

const email = 'ramthapa@gmail.com';
const newPassword = 'password123';

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected\n');
  
  const user = await User.findOne({ email });
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update user
  user.password = hashedPassword;
  await user.save();
  
  console.log('✅ Password reset successfully!\n');
  console.log('Login credentials:');
  console.log('Email:', email);
  console.log('Password:', newPassword);
  console.log('\nYou can now login at: http://localhost:3000/login');
  
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
