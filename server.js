const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://coupon-frontend-hazel.vercel.app" 
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(cors());


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Connection Failed:", err));

// Coupon Schema
const couponSchema = new mongoose.Schema({
    code: String,
    assignedTo: String,  // Stores IP Address or Cookie ID
    claimedAt: Date,
});

const Coupon = mongoose.model("Coupon", couponSchema);

// Function to assign coupons sequentially
async function getNextAvailableCoupon(userIdentifier) {
    const coupon = await Coupon.findOne({ assignedTo: null }).sort({ _id: 1 });
    if (!coupon) return null;

    coupon.assignedTo = userIdentifier;
    coupon.claimedAt = new Date();
    await coupon.save();
    return coupon.code;
}

// Middleware to prevent abuse
async function abusePrevention(req, res, next) {
    const userIP = req.ip;  // Get user IP
    const userCookie = req.cookies.userID || Math.random().toString(36).substring(2); 

    // Set cookie if not present
    if (!req.cookies.userID) {
        res.cookie("userID", userCookie, { httpOnly: true, maxAge: 60 * 60 * 1000 }); // 1 hour
    }

    // Check if user has claimed a coupon in the last hour
    const recentClaim = await Coupon.findOne({ 
        assignedTo: { $in: [userIP, userCookie] }, 
        claimedAt: { $gt: new Date(Date.now() - 3600000) } // Last 1 hour
    });

    if (recentClaim) {
        const timeLeft = Math.ceil((3600000 - (Date.now() - new Date(recentClaim.claimedAt).getTime())) / 60000);
        return res.status(429).json({ message: `You can claim another coupon in ${timeLeft} minutes.` });
    }

    req.userIdentifier = userCookie;  // Use cookie ID
    next();
}

// API to claim a coupon
app.post("/claim", abusePrevention, async (req, res) => {
    const couponCode = await getNextAvailableCoupon(req.userIdentifier);
    if (!couponCode) return res.status(400).json({ message: "No coupons left!" });

    res.json({ message: `✅ Coupon claimed: ${couponCode}` });
});
app.get("/", (req, res) => {
    res.send("Backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
