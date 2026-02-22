require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/user');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected\n');
  
  const email = 'ramthapa@gmail.com';
  const testPasswords = ['password123', 'Password123', '123456', 'ramthapa', 'hotel123'];
  
  const user = await User.findOne({ email });
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  console.log('Testing passwords for:', email);
  console.log('User role:', user.role);
  console.log('Auth provider:', user.authProvider);
  console.log('\nTrying common passwords...\n');
  
  for (const password of testPasswords) {
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      console.log(`✅ CORRECT PASSWORD: "${password}"`);
      console.log('\nUse these credentials to login:');
      console.log('Email:', email);
      console.log('Password:', password);
      process.exit(0);
    } else {
      console.log(`❌ Not: "${password}"`);
    }
  }
  
  console.log('\n⚠️  None of the common passwords worked.');
  console.log('You need to remember what password you set when creating the user.');
  console.log('\nOr you can:');
  console.log('1. Delete this user from admin panel');
  console.log('2. Create a new hotel owner with a known password');
  
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
