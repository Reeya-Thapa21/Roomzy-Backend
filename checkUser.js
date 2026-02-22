require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected');
  
  // Check for the user
  const email = 'ramthapa@gmail.com';
  const user = await User.findOne({ email });
  
  if (user) {
    console.log('\n✅ User found!');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Auth Provider:', user.authProvider);
    console.log('Is Verified:', user.isVerified);
    console.log('Status:', user.status);
    console.log('Has Password:', !!user.password);
    console.log('Password Hash:', user.password ? user.password.substring(0, 20) + '...' : 'None');
    
    if (user.hotelOwnerProfile) {
      console.log('\n🏨 Hotel Owner Profile:');
      console.log('Business Name:', user.hotelOwnerProfile.businessName);
      console.log('Phone:', user.hotelOwnerProfile.phone);
      console.log('Verification Status:', user.hotelOwnerProfile.verificationStatus);
    }
  } else {
    console.log('\n❌ User NOT found with email:', email);
    console.log('\nLet me check all users...');
    const allUsers = await User.find({}).select('name email role');
    console.log('\nAll users in database:');
    allUsers.forEach(u => {
      console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`);
    });
  }
  
  process.exit(0);
})
.catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
