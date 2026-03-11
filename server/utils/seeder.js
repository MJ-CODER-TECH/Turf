// utils/seeder.js
// Run: node utils/seeder.js --import   (to seed)
//      node utils/seeder.js --destroy  (to clear)
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Turf = require('../models/Turf');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ DB Connected');
};

const USERS = [
  { name: 'Admin User',    email: 'admin@turfzone.in',    phone: '9000000001', password: 'Admin@1234', role: 'admin' },
  { name: 'Turf Owner 1',  email: 'owner1@turfzone.in',   phone: '9000000002', password: 'Owner@1234', role: 'owner' },
  { name: 'Test Player',   email: 'player@turfzone.in',   phone: '9000000003', password: 'Player@1234', role: 'user', favouriteSport: 'Football' },
];

const TURFS_SEED = [
  {
    name: 'Green Arena',
    description: 'Premium artificial grass turf with FIFA-approved surface. Perfect for competitive 5-a-side matches.',
    sport: 'Football', type: '5-a-side', capacity: 10,
    location: { address: 'Near Metro Station, Andheri West', area: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053', coordinates: { type: 'Point', coordinates: [72.8347, 19.1136] } },
    pricing: { weekday: 800, weekend: 1000 },
    amenities: ['Parking', 'Changing Room', 'Floodlit', 'Cafeteria'],
    defaultSlots: ['06:00','08:00','10:00','16:00','18:00','20:00'],
    badge: 'Popular', isActive: true, isVerified: true, isFeatured: true,
    images: [{ public_id: 'green_arena', url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800' }]
  },
  {
    name: 'Power Pitch',
    description: 'Full-size cricket pitch with professional-grade wicket. Practice nets available.',
    sport: 'Cricket', type: 'Full Pitch', capacity: 22,
    location: { address: 'Bandra East, near BKC', area: 'Bandra East', city: 'Mumbai', state: 'Maharashtra', pincode: '400051', coordinates: { type: 'Point', coordinates: [72.8657, 19.0596] } },
    pricing: { weekday: 1200, weekend: 1500 },
    amenities: ['Parking', 'Changing Room', 'Floodlit', 'Coaching'],
    defaultSlots: ['06:00','09:00','12:00','15:00','18:00','21:00'],
    badge: 'New', isActive: true, isVerified: true, isFeatured: true,
    images: [{ public_id: 'power_pitch', url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800' }]
  },
  {
    name: 'Smash Hub',
    description: 'State-of-the-art indoor badminton complex. 4 premium courts with synthetic wooden flooring.',
    sport: 'Badminton', type: '4 Courts', capacity: 8,
    location: { address: 'Near Link Road, Malad West', area: 'Malad', city: 'Mumbai', state: 'Maharashtra', pincode: '400064', coordinates: { type: 'Point', coordinates: [72.8296, 19.1868] } },
    pricing: { weekday: 500, weekend: 650 },
    amenities: ['AC Hall', 'Parking', 'Equipment Rental', 'Changing Room'],
    defaultSlots: ['06:00','08:00','10:00','12:00','16:00','18:00','20:00'],
    badge: 'Indoor', isActive: true, isVerified: true, isFeatured: true,
    images: [{ public_id: 'smash_hub', url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800' }]
  },
];

const importData = async () => {
  try {
    await connectDB();

    // Clear existing
    await Promise.all([User.deleteMany(), Turf.deleteMany()]);
    console.log('🗑 Existing data cleared');

    // Create users
    const users = await User.create(USERS);
    const owner = users.find(u => u.role === 'owner');
    console.log(`✅ Created ${users.length} users`);

    // Assign owner to turfs
    const turfsWithOwner = TURFS_SEED.map(t => ({ ...t, owner: owner._id }));
    const turfs = await Turf.create(turfsWithOwner);
    console.log(`✅ Created ${turfs.length} turfs`);

    console.log('\n🎉 Seed complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test Credentials:');
    console.log('  Admin  : admin@turfzone.in  / Admin@1234');
    console.log('  Owner  : owner1@turfzone.in / Owner@1234');
    console.log('  Player : player@turfzone.in / Player@1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await Promise.all([User.deleteMany(), Turf.deleteMany()]);
    console.log('✅ All data destroyed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Destroy failed:', err.message);
    process.exit(1);
  }
};

if (process.argv[2] === '--import') importData();
else if (process.argv[2] === '--destroy') destroyData();
else { console.log('Usage: node seeder.js --import | --destroy'); process.exit(1); }
