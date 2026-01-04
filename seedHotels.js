const mongoose = require("mongoose");
require("dotenv").config();

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String },
  amenities: [{ type: String }],
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true
});

const Hotel = mongoose.model("Hotel", HotelSchema);

const hotels = [
  {
    name: "Hotel Yak & Yeti",
    location: "Kathmandu",
    price: 150,
    description: "Luxury 5-star hotel in the heart of Kathmandu with world-class amenities and service.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Parking"],
    rating: 4.8,
    status: "active"
  },
  {
    name: "Dwarika's Hotel",
    location: "Kathmandu",
    price: 200,
    description: "Heritage hotel showcasing traditional Newari architecture and culture.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Cultural Tours", "Parking"],
    rating: 4.9,
    status: "active"
  },
  {
    name: "Hotel Annapurna",
    location: "Kathmandu",
    price: 120,
    description: "Elegant hotel with stunning mountain views and excellent dining options.",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    amenities: ["WiFi", "Restaurant", "Bar", "Conference Room", "Parking"],
    rating: 4.5,
    status: "active"
  },
  {
    name: "Temple Tree Resort & Spa",
    location: "Pokhara",
    price: 180,
    description: "Boutique resort with lake views, spa facilities, and serene atmosphere.",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    amenities: ["WiFi", "Pool", "Spa", "Lake View", "Restaurant", "Yoga"],
    rating: 4.7,
    status: "active"
  },
  {
    name: "Fishtail Lodge",
    location: "Pokhara",
    price: 160,
    description: "Unique lakeside resort accessible only by boat, offering tranquility and nature.",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    amenities: ["WiFi", "Lake View", "Restaurant", "Garden", "Boat Access"],
    rating: 4.6,
    status: "active"
  },
  {
    name: "Hotel Barahi",
    location: "Pokhara",
    price: 140,
    description: "Lakeside hotel with panoramic views of Phewa Lake and Annapurna range.",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800",
    amenities: ["WiFi", "Pool", "Restaurant", "Lake View", "Parking"],
    rating: 4.4,
    status: "active"
  },
  {
    name: "Gokarna Forest Resort",
    location: "Kathmandu Valley",
    price: 190,
    description: "Luxury resort set in a pristine forest with golf course and wildlife.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    amenities: ["WiFi", "Golf Course", "Spa", "Restaurant", "Nature Walks", "Parking"],
    rating: 4.8,
    status: "active"
  },
  {
    name: "Pavilions Himalayas",
    location: "Pokhara",
    price: 250,
    description: "Eco-luxury resort with private villas and organic farm-to-table dining.",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
    amenities: ["WiFi", "Private Villa", "Organic Restaurant", "Spa", "Yoga", "Hiking"],
    rating: 4.9,
    status: "active"
  },
  {
    name: "Hotel Shanker",
    location: "Kathmandu",
    price: 110,
    description: "Historic palace hotel with royal heritage and modern comforts.",
    image: "https://images.unsplash.com/photo-1549294413-26f195200c16?w=800",
    amenities: ["WiFi", "Restaurant", "Garden", "Heritage Tours", "Parking"],
    rating: 4.3,
    status: "active"
  },
  {
    name: "Begnas Lake Resort",
    location: "Pokhara",
    price: 130,
    description: "Peaceful resort on the shores of Begnas Lake with mountain views.",
    image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800",
    amenities: ["WiFi", "Lake View", "Restaurant", "Boating", "Fishing", "Parking"],
    rating: 4.5,
    status: "active"
  },
  {
    name: "Hyatt Regency Kathmandu",
    location: "Kathmandu",
    price: 170,
    description: "International luxury hotel with extensive facilities and impeccable service.",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    amenities: ["WiFi", "Pool", "Spa", "Multiple Restaurants", "Gym", "Casino", "Parking"],
    rating: 4.7,
    status: "active"
  },
  {
    name: "Waterfront Resort",
    location: "Pokhara",
    price: 95,
    description: "Budget-friendly lakeside resort with comfortable rooms and friendly service.",
    image: "https://images.unsplash.com/photo-1587985064135-0366536eab42?w=800",
    amenities: ["WiFi", "Lake View", "Restaurant", "Terrace", "Parking"],
    rating: 4.2,
    status: "active"
  },
  {
    name: "Nagarkot Sunshine Hotel",
    location: "Nagarkot",
    price: 85,
    description: "Mountain retreat with sunrise views over the Himalayas.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    amenities: ["WiFi", "Mountain View", "Restaurant", "Terrace", "Hiking"],
    rating: 4.4,
    status: "active"
  },
  {
    name: "Club Himalaya",
    location: "Nagarkot",
    price: 145,
    description: "Resort hotel with panoramic Himalayan views and modern amenities.",
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Mountain View", "Parking"],
    rating: 4.6,
    status: "active"
  },
  {
    name: "Chitwan Adventure Resort",
    location: "Chitwan",
    price: 120,
    description: "Jungle resort offering wildlife safaris and nature experiences.",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    amenities: ["WiFi", "Safari Tours", "Restaurant", "Nature Walks", "Bird Watching"],
    rating: 4.5,
    status: "active"
  }
];

async function seedHotels() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing hotels
    await Hotel.deleteMany({});
    console.log("Cleared existing hotels");

    // Insert new hotels
    await Hotel.insertMany(hotels);
    console.log(`✅ Successfully added ${hotels.length} hotels!`);
    
    console.log("\nHotels by location:");
    const locations = [...new Set(hotels.map(h => h.location))];
    locations.forEach(loc => {
      const count = hotels.filter(h => h.location === loc).length;
      console.log(`  ${loc}: ${count} hotels`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding hotels:", error);
    process.exit(1);
  }
}

seedHotels();
