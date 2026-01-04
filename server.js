const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/admin-management", require("./routes/adminManagement"));
app.use("/api/admin", require("./routes/adminSystem"));
app.use("/api/hotels", require("./routes/hotels"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/hotel-owner", require("./routes/hotelOwner"));

app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
